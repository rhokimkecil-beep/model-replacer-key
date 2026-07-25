const { put, head } = require("@vercel/blob");

const BLOB_PATH = "license-keys.json";

// Reads the entire key list from the Blob store. Returns [] if the blob
// doesn't exist yet (first run).
async function loadKeys() {
  try {
    const info = await head(BLOB_PATH);
    const res = await fetch(info.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

// Overwrites the entire key list in the Blob store.
async function saveKeys(keys) {
  await put(BLOB_PATH, JSON.stringify(keys), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
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
