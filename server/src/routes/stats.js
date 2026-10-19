const express = require('express');
const Candidate = require('../models/Candidate');

const router = express.Router();

const DAY = 24 * 60 * 60 * 1000;

const FUNNEL = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
const OPEN_STAGES = ['Applied', 'Screening', 'Interview', 'Offer'];

function mean(list) {
  if (!list.length) return null;
  const total = list.reduce((sum, n) => sum + n, 0);
  return Math.round((total / list.length) * 10) / 10;
}

router.get('/', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * DAY);

    const [grouped, sources, total, newThisWeek, recent, all] = await Promise.all([
      Candidate.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      Candidate.aggregate([
        {
          $group: {
            _id: '$source',
            total: { $sum: 1 },
            hired: { $sum: { $cond: [{ $eq: ['$stage', 'Hired'] }, 1, 0] } },
          },
        },
      ]),
      Candidate.countDocuments(),
      Candidate.countDocuments({ createdAt: { $gte: weekAgo } }),
      Candidate.find().sort({ createdAt: -1 }).limit(5).select('name position stage createdAt'),
      Candidate.find().select('stage stageHistory createdAt').lean(),
    ]);

    const byStage = {};
    Candidate.STAGES.forEach((stage) => {
      byStage[stage] = 0;
    });
    grouped.forEach((row) => {
      byStage[row._id] = row.count;
    });

    const hiredCount = byStage.Hired;

    // Dwell times, funnel reach and time to hire all come from walking each
    // candidate's history in order. That reads better as a fold here than as a
    // pipeline, and the collection is small; at a larger scale this would move
    // into $setWindowFields.
    const stays = {};
    const reached = {};
    const waiting = {};
    Candidate.STAGES.forEach((stage) => {
      stays[stage] = [];
      reached[stage] = 0;
      waiting[stage] = [];
    });

    const now = Date.now();
    const hireDurations = [];

    all.forEach((candidate) => {
      const history = [...candidate.stageHistory].sort((a, b) => new Date(a.at) - new Date(b.at));

      // someone moved backwards and forwards again should only count once
      new Set(history.map((h) => h.stage)).forEach((stage) => {
        reached[stage] += 1;
      });

      history.forEach((entry, i) => {
        const next = history[i + 1];
        if (next) {
          stays[entry.stage].push((new Date(next.at) - new Date(entry.at)) / DAY);
        } else if (OPEN_STAGES.includes(entry.stage)) {
          waiting[entry.stage].push((now - new Date(entry.at)) / DAY);
        }
      });

      const hired = history.find((h) => h.stage === 'Hired');
      if (hired) hireDurations.push((new Date(hired.at) - new Date(candidate.createdAt)) / DAY);
    });

    const timeInStage = Candidate.STAGES.map((stage) => ({
      stage,
      avgDays: mean(stays[stage]),
      stays: stays[stage].length,
      waiting: waiting[stage].length,
    }));

    const conversion = FUNNEL.slice(0, -1).map((stage, i) => {
      const to = FUNNEL[i + 1];
      return {
        from: stage,
        to,
        rate: reached[stage] ? Math.round((reached[to] / reached[stage]) * 100) : 0,
      };
    });

    // Ranked by the same completed-stay average the dashboard shows, so the
    // callout and the "average time in each stage" card always agree.
    const bottleneck = OPEN_STAGES.map((stage) => ({
      stage,
      avgDays: mean(stays[stage]) || 0,
      waiting: waiting[stage].length,
    }))
      .filter((row) => row.avgDays > 0)
      .sort((a, b) => b.avgDays - a.avgDays)[0];

    const sourceQuality = sources
      .map((row) => ({
        source: row._id,
        total: row.total,
        hired: row.hired,
        hireRate: row.total ? Math.round((row.hired / row.total) * 100) : 0,
      }))
      .sort((a, b) => b.hired - a.hired || b.total - a.total);

    res.json({
      total,
      newThisWeek,
      active: total - hiredCount - byStage.Rejected,
      hireRate: total ? Math.round((hiredCount / total) * 100) : 0,
      avgDaysToHire: mean(hireDurations) || 0,
      byStage,
      timeInStage,
      conversion,
      bottleneck: bottleneck || null,
      sourceQuality,
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
