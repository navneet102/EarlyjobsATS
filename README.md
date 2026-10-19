# EarlyJobs ATS

A small applicant tracking system built with MongoDB, Express, React and Node. It covers the
usual recruiter workflow: add a candidate, move them through the hiring stages, search and
filter the list, and see where the pipeline stands on a dashboard.

## What's in it

- Candidate records with skills, source, experience and a resume link
- Six hiring stages: Applied, Screening, Interview, Offer, Hired, Rejected
- Every stage change is appended to that candidate's stage history, so the dashboard can
  work out average time to hire
- Search across name, email, position and skills, plus stage/position filters and sorting
- Kanban board with drag and drop between columns
- Notes on each candidate with a timestamp
- Dashboard metrics: totals, in pipeline, new this week, hire rate, average days to hire

## Stack

- `server/` — Express 4 and Mongoose 8. Plain CommonJS.
- `client/` — React 18 with Vite and React Router 6. Plain JavaScript, no CSS framework.

## Running it

You need Node 18+ and a MongoDB Atlas cluster. In Atlas, go to **Network Access** and add
`0.0.0.0/0` (or your own IP) otherwise the connection will just hang.

### Server

```
cd server
npm install
```

Copy `.env.example` to `.env` and fill in your connection string:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/earlyjobs?retryWrites=true&w=majority
```

Then seed and start:

```
npm run seed
npm run dev
```

The API runs on http://localhost:5000.

### Client

```
cd client
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the server on port 5000, so both need to
be running.

## Note for Windows

If PowerShell blocks `npm` with a script execution error, either use `npm.cmd` instead of
`npm`, or run this once:

```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/candidates` | List. Accepts `search`, `stage`, `position`, `sort`, `page`, `limit` |
| GET | `/api/candidates/positions` | Distinct positions, for the filter dropdown |
| GET | `/api/candidates/:id` | Single candidate with notes and history |
| POST | `/api/candidates` | Add a candidate |
| PATCH | `/api/candidates/:id` | Edit details |
| PATCH | `/api/candidates/:id/stage` | Change stage, body `{ stage, note }` |
| POST | `/api/candidates/:id/notes` | Add a note, body `{ text }` |
| DELETE | `/api/candidates/:id` | Remove a candidate |
| GET | `/api/stats` | Dashboard numbers |

## Project layout

```
server/
  seed.js                 sample data
  src/
    index.js              express setup
    db.js                 mongoose connection
    models/Candidate.js
    routes/               candidates, stats
client/src/
  api.js                  fetch wrapper
  format.js               date helpers
  pages/                  Dashboard, Candidates, CandidateDetail, AddCandidate, Board
  components/             Nav, StatCard, StageBadge, CandidateForm
  styles/main.css         all the styles
```
