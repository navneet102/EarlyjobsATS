const express = require('express');
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');

const router = express.Router();

// anything that isn't a valid ObjectId is never going to match a real candidate
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  next();
});

// a stray bracket or plus in the search box would blow up the regex otherwise
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// strips out fields the client should not be able to set directly
function clean(body) {
  const data = { ...body };
  delete data._id;
  delete data.notes;
  delete data.stageHistory;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.__v;

  if (typeof data.skills === 'string') {
    data.skills = data.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return data;
}

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
};

router.get('/', async (req, res) => {
  try {
    const { search = '', stage, position } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 200);

    const filter = {};
    if (stage && stage !== 'All') filter.stage = stage;
    if (position && position !== 'All') filter.position = position;

    if (search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { position: rx }, { skills: rx }];
    }

    const total = await Candidate.countDocuments(filter);
    const items = await Candidate.find(filter)
      .sort(SORTS[req.query.sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-notes -stageHistory');

    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// feeds the position dropdown on the candidates page
router.get('/positions', async (req, res) => {
  try {
    const positions = await Candidate.distinct('position');
    res.json({ positions: positions.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, position } = req.body;
    if (!name || !email || !position) {
      return res.status(400).json({ message: 'Name, email and position are required' });
    }

    const duplicate = await Candidate.findOne({ email: email.toLowerCase().trim() }).select('name');
    if (duplicate) {
      return res.status(409).json({ message: `Already on file as "${duplicate.name}" for this email address` });
    }

    const candidate = await Candidate.create(clean(req.body));
    res.status(201).json(candidate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const changes = clean(req.body);
    delete changes.stage; // stage moves go through /stage so they land in the history

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true,
    });

    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/stage', async (req, res) => {
  try {
    const { stage, note = '' } = req.body;

    if (!Candidate.STAGES.includes(stage)) {
      return res.status(400).json({ message: `"${stage}" is not a valid stage` });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.stageHistory.push({ from: candidate.stage, stage, note });
    candidate.stage = stage;
    await candidate.save();

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/notes', async (req, res) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Write something before saving' });

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.notes.push({ text });
    await candidate.save();

    res.status(201).json(candidate.notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await Candidate.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Candidate not found' });
    res.json({ message: 'Candidate removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
