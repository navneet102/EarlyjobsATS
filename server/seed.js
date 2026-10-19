require('dotenv').config();

const mongoose = require('mongoose');
const connect = require('./src/db');
const Candidate = require('./src/models/Candidate');

const DAY = 24 * 60 * 60 * 1000;
const ago = (n) => new Date(Date.now() - n * DAY);

const people = [
  { name: 'Aditya Menon', position: 'Frontend Developer', stage: 'Interview', source: 'LinkedIn', experience: 3, skills: ['React', 'JavaScript', 'CSS'], days: 12 },
  { name: 'Sneha Kulkarni', position: 'Backend Developer', stage: 'Hired', source: 'Referral', experience: 5, skills: ['Node.js', 'MongoDB', 'AWS'], days: 34 },
  { name: 'Rahul Verma', position: 'QA Engineer', stage: 'Screening', source: 'Website', experience: 2, skills: ['Selenium', 'Manual Testing'], days: 4 },
  { name: 'Priya Nair', position: 'Data Analyst', stage: 'Offer', source: 'LinkedIn', experience: 4, skills: ['SQL', 'Python', 'Tableau'], days: 19 },
  { name: 'Karthik Reddy', position: 'DevOps Engineer', stage: 'Rejected', source: 'Campus', experience: 1, skills: ['Docker', 'Linux'], days: 22 },
  { name: 'Ananya Iyer', position: 'Frontend Developer', stage: 'Applied', source: 'Website', experience: 1, skills: ['HTML', 'CSS', 'JavaScript'], days: 2 },
  { name: 'Mohit Sharma', position: 'Backend Developer', stage: 'Interview', source: 'LinkedIn', experience: 6, skills: ['Java', 'Spring Boot', 'MySQL'], days: 15 },
  { name: 'Divya Pillai', position: 'HR Intern', stage: 'Hired', source: 'Campus', experience: 0, skills: ['Communication', 'Excel'], days: 41 },
  { name: 'Arjun Bansal', position: 'Frontend Developer', stage: 'Screening', source: 'Referral', experience: 2, skills: ['React', 'Redux'], days: 6 },
  { name: 'Neha Gupta', position: 'Data Analyst', stage: 'Interview', source: 'Website', experience: 3, skills: ['Power BI', 'SQL'], days: 9 },
  { name: 'Siddharth Rao', position: 'Backend Developer', stage: 'Applied', source: 'LinkedIn', experience: 4, skills: ['Go', 'PostgreSQL'], days: 1 },
  { name: 'Meera Joshi', position: 'QA Engineer', stage: 'Offer', source: 'Referral', experience: 3, skills: ['Cypress', 'API Testing'], days: 17 },
  { name: 'Vikram Singh', position: 'DevOps Engineer', stage: 'Screening', source: 'LinkedIn', experience: 7, skills: ['Kubernetes', 'Terraform', 'AWS'], days: 5 },
  { name: 'Ishita Chatterjee', position: 'Frontend Developer', stage: 'Rejected', source: 'Website', experience: 0, skills: ['HTML', 'Bootstrap'], days: 28 },
  { name: 'Nikhil Desai', position: 'Data Analyst', stage: 'Applied', source: 'Campus', experience: 1, skills: ['Excel', 'R'], days: 3 },
  { name: 'Pooja Malhotra', position: 'HR Intern', stage: 'Screening', source: 'Campus', experience: 0, skills: ['Recruiting', 'Excel'], days: 8 },
  { name: 'Rohan Kapoor', position: 'Backend Developer', stage: 'Hired', source: 'Referral', experience: 5, skills: ['Node.js', 'Redis', 'Docker'], days: 30 },
  { name: 'Tanya Bhatt', position: 'QA Engineer', stage: 'Applied', source: 'Website', experience: 2, skills: ['Playwright', 'JavaScript'], days: 1 },
  { name: 'Harsh Patel', position: 'Frontend Developer', stage: 'Offer', source: 'LinkedIn', experience: 4, skills: ['React', 'TypeScript'], days: 21 },
  { name: 'Lakshmi Subramanian', position: 'Data Analyst', stage: 'Rejected', source: 'LinkedIn', experience: 2, skills: ['SQL', 'Looker'], days: 25 },
  { name: 'Aman Khanna', position: 'DevOps Engineer', stage: 'Interview', source: 'Website', experience: 4, skills: ['Jenkins', 'Ansible'], days: 11 },
  { name: 'Ritika Saxena', position: 'Frontend Developer', stage: 'Hired', source: 'LinkedIn', experience: 3, skills: ['Vue', 'CSS', 'Jest'], days: 38 },
  { name: 'Suresh Kumar', position: 'Backend Developer', stage: 'Rejected', source: 'Campus', experience: 0, skills: ['Python', 'Flask'], days: 19 },
  { name: 'Farah Ansari', position: 'QA Engineer', stage: 'Interview', source: 'Referral', experience: 5, skills: ['Selenium', 'Java'], days: 13 },
];

const FLOW = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

// Roughly how long candidates sit before moving on. Interview and Offer take
// the longest in practice because scheduling and negotiating drag on.
const GAPS = {
  Screening: [1, 3],
  Interview: [3, 7],
  Offer: [6, 14],
  Hired: [3, 10],
  Rejected: [2, 10],
};

function gapFor(stage, seed) {
  const [min, max] = GAPS[stage];
  return min + ((seed * 37 + stage.length * 11) % (max - min + 1));
}

function historyFor(stage, applied, seed, windowDays) {
  const path =
    stage === 'Rejected' ? ['Applied', 'Screening', 'Rejected'] : FLOW.slice(0, FLOW.indexOf(stage) + 1);

  const gaps = path.slice(1).map((s) => gapFor(s, seed));
  const spread = gaps.reduce((sum, d) => sum + d, 0);

  // squeeze the gaps if they would push the last event past today
  const room = Math.max(windowDays - 1, 0);
  const scale = spread > room && spread > 0 ? room / spread : 1;

  let at = new Date(applied);
  let previous = '';

  return path.map((entry, i) => {
    if (i > 0) at = new Date(at.getTime() + gaps[i - 1] * scale * DAY);

    const step = { stage: entry, from: previous, at };
    if (entry === 'Rejected') step.note = 'Did not clear the screening round';

    previous = entry;
    return step;
  });
}

function emailFor(name) {
  return name.toLowerCase().replace(/[^a-z]+/g, '.') + '@gmail.com';
}

function phoneFor(i) {
  return '98' + String(45000000 + i * 137717).slice(0, 8);
}

async function run() {
  await connect();

  await Candidate.deleteMany({});

  const docs = people.map((p, i) => {
    const applied = ago(p.days);
    return {
      name: p.name,
      email: emailFor(p.name),
      phone: phoneFor(i + 3),
      position: p.position,
      stage: p.stage,
      source: p.source,
      experience: p.experience,
      skills: p.skills,
      resumeUrl: '',
      notes: [],
      stageHistory: historyFor(p.stage, applied, i + 1, p.days),
      createdAt: applied,
      updatedAt: applied,
    };
  });

  // insertMany keeps the createdAt values above; save() would stamp them all as now
  await Candidate.insertMany(docs, { timestamps: false });

  console.log(`Seeded ${docs.length} candidates`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
