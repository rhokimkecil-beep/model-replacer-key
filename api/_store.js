const { put, list, del } = require("@vercel/blob");

// Instead of overwriting one fixed pathname (which sits behind Vercel
// Blob's public CDN and can serve stale cached content for a window after
// each write), every save writes a brand-new versioned file. Reads use
// list() — a control-plane call, not a CDN read — to find the latest
// version, so there's no cache-staleness window at all. Old versions are
// deleted right after a successful write so the store doesn't grow forever.

const PREFIX = "license-keys-";

function pathFor(now) {
  return `${PREFIX}${now}-${Math.random().toString(36).slice(2, 8)}.json`;
}

// Reads the entire key list from the Blob store. Returns [] if no version
// exists yet (first run).
async function loadKeys() {
  try {
    const { blobs } = await list({ prefix: PREFIX });
    if (!blobs || blobs.length === 0) return [];

    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const latest = blobs[0];

    const res = await fetch(latest.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("loadKeys error:", err);
    return [];
  }
}

// Writes a new versioned file, then cleans up every older version.
async function saveKeys(keys) {
  const now = Date.now();
  const newPath = pathFor(now);

  await put(newPath, JSON.stringify(keys), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });

  try {
    const { blobs } = await list({ prefix: PREFIX });
    const stale = blobs.filter(b => b.pathname !== newPath);
    if (stale.length > 0) {
      await del(stale.map(b => b.url));
    }
  } catch (err) {
    // Cleanup failing doesn't matter for correctness — just means an old
    // version lingers until the next save. Never let it break the write.
    console.error("saveKeys cleanup error:", err);
  }
}

function requireAdmin(req, res) {
  const secret = req.headers["x-admin-secret"] || (req.body && req.body.adminSecret);
  if (!process.env.ADMIN_SECRET) {
    res.status(500).json({ error: "ADMIN_SECRET not configured on server." });
    return false;
  }
  if (secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized." });
    return false;
  }
  return true;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
}

module.exports = { loadKeys, saveKeys, requireAdmin, setCors };
