export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`/api${path}`, { ...options, headers });

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    // 204s and the like have nothing to parse
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }

  return data;
}

export const get = (path) => api(path);

export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });

export const patch = (path, body) => api(path, { method: 'PATCH', body: JSON.stringify(body) });

export const del = (path) => api(path, { method: 'DELETE' });
