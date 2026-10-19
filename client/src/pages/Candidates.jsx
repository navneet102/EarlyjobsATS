import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get } from '../api';
import StageBadge from '../components/StageBadge';
import { formatDate } from '../format';

const STAGES = ['All', 'Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

export default function Candidates() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('All');
  const [position, setPosition] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // wait for a pause in typing before firing the request
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    get('/candidates/positions')
      .then((res) => setPositions(res.positions))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page, limit: 10, sort });
    if (query) params.set('search', query);
    if (stage !== 'All') params.set('stage', stage);
    if (position !== 'All') params.set('position', position);

    setLoading(true);
    setError('');

    get(`/candidates?${params}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, stage, position, sort, page]);

  async function remove(candidate) {
    if (!window.confirm(`Delete ${candidate.name}? This cannot be undone.`)) return;

    try {
      await del(`/candidates/${candidate._id}`);
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((c) => c._id !== candidate._id),
        total: prev.total - 1,
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  function resetFilters() {
    setSearch('');
    setQuery('');
    setStage('All');
    setPosition('All');
    setSort('newest');
    setPage(1);
  }

  return (
    <div>
      <div className="page-head">
        <h1>Candidates</h1>
        <Link to="/candidates/new" className="btn btn-primary">
          Add candidate
        </Link>
      </div>

      <div className="filters">
        <input
          className="grow"
          placeholder="Search by name, email, position or skill"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setPage(1);
          }}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All stages' : s}
            </option>
          ))}
        </select>

        <select
          value={position}
          onChange={(e) => {
            setPosition(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All positions</option>
          {positions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </select>

        <button type="button" className="btn" onClick={resetFilters}>
          Clear
        </button>
      </div>

      <p className="muted small">
        {loading ? 'Loading…' : `${data.total} candidate${data.total === 1 ? '' : 's'}`}
      </p>

      {error && <p className="message error">{error}</p>}

      {!loading && data.items.length === 0 && (
        <p className="muted">No candidates matched those filters.</p>
      )}

      {data.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Stage</th>
                <th>Source</th>
                <th>Experience</th>
                <th>Applied</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c._id}>
                  <td data-label="Name">
                    <Link to={`/candidates/${c._id}`}>{c.name}</Link>
                    <span className="muted small block">{c.email}</span>
                  </td>
                  <td data-label="Position">{c.position}</td>
                  <td data-label="Stage">
                    <StageBadge stage={c.stage} />
                  </td>
                  <td data-label="Source">{c.source}</td>
                  <td data-label="Experience">{c.experience} yrs</td>
                  <td data-label="Applied">{formatDate(c.createdAt)}</td>
                  <td data-label="Actions" className="row-actions">
                    <Link className="btn btn-sm" to={`/candidates/${c._id}`}>
                      View
                    </Link>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(c)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.pages > 1 && (
        <div className="pager">
          <button
            type="button"
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="muted small">
            Page {page} of {data.pages}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
