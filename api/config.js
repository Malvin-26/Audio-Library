function sanitizeSupabaseUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }
}

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const rawUrl =
    process.env.SUPABASE_URL || "https://pnysywzorgsomfvpuvic.supabase.co";
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    hasAnonKey: Boolean(supabaseAnonKey),
  });
};
