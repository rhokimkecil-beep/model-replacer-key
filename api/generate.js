const crypto = require("crypto");
const { loadKeys, saveKeys, requireAdmin, setCors } = require("./_store");

function makeKey() {
  const seg = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `MR-${seg()}-${seg()}-${seg()}`;
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!requireAdmin(req, res)) return;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const label = (body.label || "").trim() || null;
    const durationHours = Number(body.durationHours); // 0 or missing = never expires
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = durationHours > 0 ? now + Math.floor(durationHours * 3600) : null;

    const keys = await loadKeys();

    let key;
    do {
      key = makeKey();
    } while (keys.some(k => k.key_code === key));

    keys.push({
      key_code: key,
      label,
      created_at: now,
      expires_at: expiresAt,
      revoked: false,
      last_validated_at: null,
      last_ip: null,
    });

    await saveKeys(keys);

    return res.status(200).json({ key, label, created_at: now, expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};
