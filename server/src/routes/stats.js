const express = require('express');
const Candidate = require('../models/Candidate');

const router = express.Router();

const DAY = 24 * 60 * 60 * 1000;

router.get('/', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * DAY);

    const [grouped, sources, total, newThisWeek, recent, hired] = await Promise.all([
      Candidate.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      Candidate.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      Candidate.countDocuments(),
      Candidate.countDocuments({ createdAt: { $gte: weekAgo } }),
      Candidate.find().sort({ createdAt: -1 }).limit(5).select('name position stage createdAt'),
      Candidate.find({ stage: 'Hired' }).select('createdAt stageHistory'),
    ]);

    const byStage = {};
    Candidate.STAGES.forEach((s) => {
      byStage[s] = 0;
    });
    grouped.forEach((row) => {
      byStage[row._id] = row.count;
    });

    const hiredCount = byStage.Hired;
    const days = hired
      .map((c) => {
        const entry = c.stageHistory.find((h) => h.stage === 'Hired');
        if (!entry) return null;
        return (entry.at - c.createdAt) / DAY;
      })
      .filter((d) => d !== null && d >= 0);

    const avgDaysToHire = days.length
      ? Math.round((days.reduce((sum, d) => sum + d, 0) / days.length) * 10) / 10
      : 0;

    res.json({
      total,
      newThisWeek,
      active: total - hiredCount - byStage.Rejected,
      hireRate: total ? Math.round((hiredCount / total) * 100) : 0,
      avgDaysToHire,
      byStage,
      bySource: sources.map((s) => ({ source: s._id, count: s.count })),
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
