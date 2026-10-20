# EarlyJobs ATS

A small applicant tracking system built with the MERN stack. Recruiters can add
candidates, move them through hiring stages, search the list, and see pipeline
stats.

## Stack

MongoDB Atlas, Express, React (Vite), Node.

## Running locally

You need Node 18+ and a MongoDB connection string.

### Server

```
cd server
npm install
```

Create `server/.env` with:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Then load the sample data and start the API:

```
npm run seed
npm run dev
```

The API runs on http://localhost:5000. `npm run seed` clears the candidates
collection and inserts 24 sample candidates.

### Client

```
cd client
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to port 5000, so the API needs
to be running too.

## Features

- Candidate list with search, stage and position filters, and sorting
- Kanban board with drag and drop between stages
- Candidate page with interview notes and stage history
- Dashboard with stage counts, conversion rates, time per stage and sources
- Duplicate email check when adding a candidate
- Referral source with the referrer's name

## Note

Resumes are stored as links, not uploaded files.
