module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || "https://pnysywzorgsomfvpuvic.supabase.co";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    hasAnonKey: Boolean(supabaseAnonKey),
  });
};
