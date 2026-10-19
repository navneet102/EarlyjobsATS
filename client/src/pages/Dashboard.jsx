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
  const busiest = Math.max(...stages.map(([, count]) => count), 1);
  const slowest = Math.max(...stats.timeInStage.map((row) => row.avgDays || 0), 1);

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

      {stats.bottleneck && (
        <div className="callout">
          <strong>Slowest stage:</strong> candidates take an average of {stats.bottleneck.avgDays} days to
          clear {stats.bottleneck.stage}
          {stats.bottleneck.waiting > 0 &&
            `, and ${stats.bottleneck.waiting} ${stats.bottleneck.waiting === 1 ? 'is' : 'are'} waiting there now`}
          .
        </div>
      )}

      <div className="two-col">
        <section className="card">
          <h2>Pipeline by stage</h2>
          {stages.map(([stage, count]) => (
            <div className="bar-row" key={stage}>
              <span className="bar-label">{stage}</span>
              <div className="bar-track">
                <div
                  className={`bar bar-${stage.toLowerCase()}`}
                  style={{ width: `${(count / busiest) * 100}%` }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </section>

        <section className="card">
          <h2>Stage conversion</h2>
          {stats.conversion.map((step) => (
            <div className="bar-row funnel-row" key={step.to}>
              <span className="bar-label">
                {step.from} → {step.to}
              </span>
              <div className="bar-track">
                <div className="bar bar-neutral" style={{ width: `${step.rate}%` }} />
              </div>
              <span className="bar-count">{step.rate}%</span>
            </div>
          ))}
          <p className="muted small">Of everyone who reached a stage, how many moved to the next one.</p>
        </section>
      </div>

      <section className="card">
        <h2>Average time in each stage</h2>
        {stats.timeInStage.map((row) => (
          <div className="bar-row" key={row.stage}>
            <span className="bar-label">{row.stage}</span>
            <div className="bar-track">
              <div
                className={`bar bar-${row.stage.toLowerCase()}`}
                style={{ width: `${((row.avgDays || 0) / slowest) * 100}%` }}
              />
            </div>
            <span className="bar-count">{row.avgDays === null ? '—' : row.avgDays}</span>
          </div>
        ))}
        <p className="muted small">
          Days per stage, averaged over completed stays. Rejected and Hired have no average because
          nothing follows them.
        </p>
      </section>

      <section className="card">
        <h2>Which sources actually hire</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Candidates</th>
              <th>Hired</th>
              <th>Hire rate</th>
            </tr>
          </thead>
          <tbody>
            {stats.sourceQuality.map((row) => (
              <tr key={row.source}>
                <td data-label="Source">{row.source}</td>
                <td data-label="Candidates">{row.total}</td>
                <td data-label="Hired">{row.hired}</td>
                <td data-label="Hire rate">{row.hireRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

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
