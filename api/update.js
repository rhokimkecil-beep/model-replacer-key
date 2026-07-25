const { loadKeys, saveKeys, requireAdmin, setCors } = require("./_store");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!requireAdmin(req, res)) return;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const key = (body.key || "").trim();
    if (!key) return res.status(400).json({ error: "Missing key." });

    const keys = await loadKeys();
    const idx = keys.findIndex(k => k.key_code === key);
    if (idx === -1) return res.status(404).json({ error: "Key not found." });

    // expiresAt: unix seconds, or null for never-expires, or omit to leave unchanged
    if (Object.prototype.hasOwnProperty.call(body, "expiresAt")) {
      keys[idx].expires_at = body.expiresAt;
    }
    if (Object.prototype.hasOwnProperty.call(body, "label")) {
      keys[idx].label = body.label;
    }

    await saveKeys(keys);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};
