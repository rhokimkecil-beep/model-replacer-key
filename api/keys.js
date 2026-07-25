const { loadKeys, requireAdmin, setCors } = require("./_store");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  if (!requireAdmin(req, res)) return;

  try {
    const keys = await loadKeys();
    const sorted = [...keys].sort((a, b) => b.created_at - a.created_at);
    return res.status(200).json({ keys: sorted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};
