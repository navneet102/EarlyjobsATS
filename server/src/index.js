require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const connect = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/stats', require('./routes/stats'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const clientDist = path.join(__dirname, '../../client/dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const port = process.env.PORT || 5000;

connect()
  .then(() => {
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
