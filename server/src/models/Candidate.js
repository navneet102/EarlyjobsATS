const mongoose = require('mongoose');

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const SOURCES = ['LinkedIn', 'Referral', 'Website', 'Campus', 'Other'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    stage: { type: String, enum: STAGES },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    position: { type: String, required: true, trim: true },
    stage: { type: String, enum: STAGES, default: 'Applied' },
    source: { type: String, enum: SOURCES, default: 'Website' },
    experience: { type: Number, default: 0, min: 0 },
    skills: { type: [String], default: [] },
    resumeUrl: { type: String, default: '' },
    notes: { type: [noteSchema], default: [] },
    stageHistory: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

candidateSchema.index({ stage: 1 });
candidateSchema.index({ createdAt: -1 });

// every candidate's history should open with the stage they were added in
candidateSchema.pre('save', function (next) {
  if (this.isNew && this.stageHistory.length === 0) {
    this.stageHistory.push({ stage: this.stage });
  }
  next();
});

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
module.exports.STAGES = STAGES;
module.exports.SOURCES = SOURCES;
