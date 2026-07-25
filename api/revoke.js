const { loadKeys, saveKeys, requireAdmin, setCors } = require("./_store");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!requireAdmin(req, res)) return;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const key = (body.key || "").trim();
    const action = body.action || "revoke"; // "revoke" | "unrevoke" | "delete"

    if (!key) return res.status(400).json({ error: "Missing key." });

    let keys = await loadKeys();
    const idx = keys.findIndex(k => k.key_code === key);
    if (idx === -1) return res.status(404).json({ error: "Key not found." });

    if (action === "delete") {
      keys.splice(idx, 1);
    } else {
      keys[idx].revoked = action !== "unrevoke";
    }

    await saveKeys(keys);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};
