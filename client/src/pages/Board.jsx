import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, patch } from '../api';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

export default function Board() {
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/candidates?limit=200&sort=newest')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function move(candidate, stage) {
    if (candidate.stage === stage) return;

    const before = candidate.stage;
    setItems((prev) => prev.map((c) => (c._id === candidate._id ? { ...c, stage } : c)));

    try {
      await patch(`/candidates/${candidate._id}/stage`, { stage });
    } catch (err) {
      setError(err.message);
      setItems((prev) => prev.map((c) => (c._id === candidate._id ? { ...c, stage: before } : c)));
    }
  }

  function drop(stage) {
    setOver(null);
    const candidate = items.find((c) => c._id === dragging);
    setDragging(null);
    if (candidate) move(candidate, stage);
  }

  if (loading) return <p className="muted">Loading board…</p>;

  return (
    <div>
      <div className="page-head">
        <h1>Hiring board</h1>
        <Link to="/candidates/new" className="btn btn-primary">
          Add candidate
        </Link>
      </div>

      <p className="muted small">
        Drag a card into another column to change the stage. On a phone, use the dropdown on each card.
      </p>

      {error && <p className="message error">{error}</p>}

      <div className="board">
        {STAGES.map((stage) => {
          const column = items.filter((c) => c.stage === stage);

          return (
            <div
              key={stage}
              className={`column ${over === stage ? 'column-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={() => drop(stage)}
            >
              <div className={`column-head stage-${stage.toLowerCase()}`}>
                <span>{stage}</span>
                <span className="count">{column.length}</span>
              </div>

              <div className="column-body">
                {column.map((c) => (
                  <div
                    key={c._id}
                    className="mini-card"
                    draggable
                    onDragStart={() => setDragging(c._id)}
                    onDragEnd={() => setDragging(null)}
                  >
                    <Link to={`/candidates/${c._id}`}>{c.name}</Link>
                    <span className="muted small block">{c.position}</span>
                    <select
                      className="mini-select"
                      value={c.stage}
                      onChange={(e) => move(c, e.target.value)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {column.length === 0 && <p className="muted small empty">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
