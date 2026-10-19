import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { del, get, patch, post } from '../api';
import CandidateForm from '../components/CandidateForm';
import StageBadge from '../components/StageBadge';
import { formatDate } from '../format';

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [stageNote, setStageNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get(`/candidates/${id}`)
      .then(setCandidate)
      .catch((err) => setError(err.message));
  }, [id]);

  async function save(values) {
    const updated = await patch(`/candidates/${id}`, values);
    setCandidate(updated);
    setEditing(false);
  }

  async function changeStage(stage) {
    if (stage === candidate.stage) return;

    setBusy(true);
    setError('');
    try {
      const updated = await patch(`/candidates/${id}/stage`, { stage, note: stageNote.trim() });
      setCandidate(updated);
      setStageNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;

    try {
      await post(`/candidates/${id}/notes`, { text: note });
      const fresh = await get(`/candidates/${id}`);
      setCandidate(fresh);
      setNote('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${candidate.name}? This cannot be undone.`)) return;
    await del(`/candidates/${id}`);
    navigate('/candidates');
  }

  if (error && !candidate) return <p className="message error">{error}</p>;
  if (!candidate) return <p className="muted">Loading…</p>;

  const history = [...candidate.stageHistory].sort((a, b) => new Date(a.at) - new Date(b.at));
  const notes = [...candidate.notes].reverse();

  return (
    <div>
      <p className="small">
        <Link to="/candidates">← Back to candidates</Link>
      </p>

      <div className="page-head">
        <h1>{candidate.name}</h1>
        <div className="head-actions">
          <button type="button" className="btn" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel edit' : 'Edit details'}
          </button>
          <button type="button" className="btn btn-danger" onClick={remove}>
            Delete
          </button>
        </div>
      </div>

      {error && <p className="message error">{error}</p>}

      {editing ? (
        <div className="card">
          <CandidateForm initial={candidate} onSubmit={save} submitLabel="Save changes" onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div className="card">
          <div className="detail-grid">
            <div>
              <span className="detail-label">Email</span>
              <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
            </div>
            <div>
              <span className="detail-label">Phone</span>
              <span>{candidate.phone || '—'}</span>
            </div>
            <div>
              <span className="detail-label">Position</span>
              <span>{candidate.position}</span>
            </div>
            <div>
              <span className="detail-label">Source</span>
              <span>{candidate.source}</span>
            </div>
            <div>
              <span className="detail-label">Experience</span>
              <span>{candidate.experience} yrs</span>
            </div>
            <div>
              <span className="detail-label">Applied on</span>
              <span>{formatDate(candidate.createdAt)}</span>
            </div>
            <div>
              <span className="detail-label">Resume</span>
              {candidate.resumeUrl ? (
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                  Open link
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            <div>
              <span className="detail-label">Current stage</span>
              <StageBadge stage={candidate.stage} />
            </div>
            {candidate.referredBy && (
              <div>
                <span className="detail-label">Referred by</span>
                <span>{candidate.referredBy}</span>
              </div>
            )}
          </div>

          {candidate.skills.length > 0 && (
            <div className="skills">
              {candidate.skills.map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="two-col">
        <section className="card">
          <h2>Move to another stage</h2>

          <label>
            Note for this move (optional)
            <input value={stageNote} onChange={(e) => setStageNote(e.target.value)} placeholder="Why is the stage changing?" />
          </label>

          <div className="stage-buttons">
            {['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map((s) => (
              <button
                key={s}
                type="button"
                className={`btn btn-sm ${s === candidate.stage ? 'btn-primary' : ''}`}
                disabled={busy || s === candidate.stage}
                onClick={() => changeStage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Feedback & notes</h2>

          <form className="note-form" onSubmit={addNote}>
            <textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add interview feedback…" />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!note.trim()}>
              Add note
            </button>
          </form>

          {notes.length === 0 && <p className="muted small">No notes yet.</p>}

          <ul className="notes">
            {notes.map((n, i) => (
              <li key={i}>
                <p>{n.text}</p>
                <span className="muted small">{formatDate(n.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Stage history</h2>
        <ol className="timeline">
          {history.map((h, i) => (
            <li key={i}>
              {h.from ? (
                <span className="move">
                  <StageBadge stage={h.from} />
                  <span className="muted">→</span>
                  <StageBadge stage={h.stage} />
                </span>
              ) : (
                <StageBadge stage={h.stage} />
              )}
              <span className="muted small">{formatDate(h.at)}</span>
              {h.note && <p className="small">{h.note}</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
