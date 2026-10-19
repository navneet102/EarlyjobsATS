import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';
import StatCard from '../components/StatCard';
import StageBadge from '../components/StageBadge';
import { daysSince } from '../format';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    get('/stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="message error">{error}</p>;
  if (!stats) return <p className="muted">Loading dashboard…</p>;

  const stages = Object.entries(stats.byStage);
  const highest = Math.max(...stages.map(([, count]) => count), 1);
  const sourceTotal = stats.bySource.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
        <Link to="/candidates/new" className="btn btn-primary">
          Add candidate
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Total candidates" value={stats.total} />
        <StatCard label="In pipeline" value={stats.active} hint="Not hired or rejected" />
        <StatCard label="New this week" value={stats.newThisWeek} hint="Last 7 days" />
        <StatCard label="Hire rate" value={`${stats.hireRate}%`} hint="Hired / total" />
        <StatCard label="Avg. days to hire" value={stats.avgDaysToHire} />
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Pipeline by stage</h2>
          {stages.map(([stage, count]) => (
            <div className="bar-row" key={stage}>
              <span className="bar-label">{stage}</span>
              <div className="bar-track">
                <div
                  className={`bar bar-${stage.toLowerCase()}`}
                  style={{ width: `${(count / highest) * 100}%` }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </section>

        <section className="card">
          <h2>Where they came from</h2>
          {sourceTotal === 0 && <p className="muted">No candidates yet.</p>}
          {stats.bySource.map((row) => (
            <div className="bar-row" key={row.source}>
              <span className="bar-label">{row.source}</span>
              <div className="bar-track">
                <div className="bar bar-neutral" style={{ width: `${(row.count / sourceTotal) * 100}%` }} />
              </div>
              <span className="bar-count">{row.count}</span>
            </div>
          ))}
        </section>
      </div>

      <section className="card">
        <h2>Recently added</h2>
        {stats.recent.length === 0 && <p className="muted">Nothing here yet.</p>}
        <ul className="plain-list">
          {stats.recent.map((c) => (
            <li key={c._id}>
              <Link to={`/candidates/${c._id}`}>{c.name}</Link>
              <span className="muted small">{c.position}</span>
              <StageBadge stage={c.stage} />
              <span className="muted small nowrap">{daysSince(c.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
