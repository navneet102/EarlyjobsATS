import { useState } from 'react';

const SOURCES = ['LinkedIn', 'Referral', 'Website', 'Campus', 'Other'];

export default function CandidateForm({ initial, onSubmit, submitLabel = 'Save', onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    position: initial?.position || '',
    source: initial?.source || 'Website',
    experience: initial?.experience ?? 0,
    skills: (initial?.skills || []).join(', '),
    resumeUrl: initial?.resumeUrl || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function change(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        position: form.position.trim(),
        source: form.source,
        experience: Number(form.experience) || 0,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        resumeUrl: form.resumeUrl.trim(),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      {error && <p className="message error">{error}</p>}

      <div className="form-row">
        <label>
          Full name *
          <input value={form.name} onChange={change('name')} required />
        </label>
        <label>
          Email *
          <input type="email" value={form.email} onChange={change('email')} required />
        </label>
      </div>

      <div className="form-row">
        <label>
          Phone
          <input value={form.phone} onChange={change('phone')} />
        </label>
        <label>
          Position applied for *
          <input value={form.position} onChange={change('position')} required />
        </label>
      </div>

      <div className="form-row">
        <label>
          Source
          <select value={form.source} onChange={change('source')}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Experience (years)
          <input type="number" min="0" step="0.5" value={form.experience} onChange={change('experience')} />
        </label>
      </div>

      <label>
        Skills
        <input value={form.skills} onChange={change('skills')} placeholder="React, Node.js, SQL" />
        <span className="hint">Separate with commas</span>
      </label>

      <label>
        Resume link
        <input value={form.resumeUrl} onChange={change('resumeUrl')} placeholder="https://…" />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
