const { loadKeys, saveKeys, setCors } = require("./_store");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ valid: false, message: "Method not allowed." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const rawKey = (body.key || "").trim();

    if (!rawKey) {
      return res.status(200).json({ valid: false, message: "No key provided." });
    }

    const keys = await loadKeys();
    const idx = keys.findIndex(k => k.key_code === rawKey);

    if (idx === -1) {
      return res.status(200).json({ valid: false, message: "Invalid key." });
    }

    const row = keys[idx];
    const now = Math.floor(Date.now() / 1000);

    if (row.revoked) {
      return res.status(200).json({ valid: false, message: "Key revoked." });
    }

    if (row.expires_at && now > row.expires_at) {
      return res.status(200).json({ valid: false, message: "Key expired.", expired: true });
    }

    row.last_validated_at = now;
    row.last_ip = req.headers["x-forwarded-for"] || "";
    await saveKeys(keys);

    return res.status(200).json({
      valid: true,
      user: row.label || "User",
      expires_at: row.expires_at,
      message: "OK",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ valid: false, message: "Server error." });
  }
};
