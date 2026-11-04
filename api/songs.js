const { createClient } = require("@supabase/supabase-js");

const DEFAULT_SUPABASE_URL = "https://pnysywzorgsomfvpuvic.supabase.co";

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error("Supabase client init error:", err.message);
    return null;
  }
}

function parseBody(req) {
  if (req.body == null) return null;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const supabase = getSupabaseClient();

    /* GET: Fetch songs list */
    if (req.method === "GET") {
      if (!supabase) {
        console.warn("Supabase credentials not configured in environment variables.");
        return res.status(200).json([]);
      }

      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.warn("Supabase query error:", error.message);
        return res.status(200).json([]);
      }

      return res.status(200).json(data || []);
    }

    /* POST: Add new song */
    if (req.method === "POST") {
      if (!supabase) {
        return res.status(400).json({
          error:
            "Supabase credentials not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your Vercel project settings.",
        });
      }

      const payload = parseBody(req);
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid JSON request body" });
      }

      const title = (payload.title || "").trim();
      const artist = (payload.artist || "").trim();
      const file = (payload.file || "").trim();
      const cover = (payload.cover || "").trim();
      const lyrics = payload.lyrics != null ? String(payload.lyrics).trim() : "";

      if (!title || !artist || !file || !cover) {
        return res
          .status(400)
          .json({ error: "title, artist, file, and cover are required" });
      }

      const { data, error } = await supabase
        .from("songs")
        .insert([{ title, artist, file, cover, lyrics }])
        .select();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res
        .status(201)
        .json(data && data[0] ? data[0] : { message: "Song added successfully" });
    }

    /* DELETE: Remove song */
    if (req.method === "DELETE") {
      if (!supabase) {
        return res.status(400).json({
          error: "Supabase credentials not configured.",
        });
      }

      const id = req.query?.id || (parseBody(req) || {})?.id;
      if (!id) {
        return res.status(400).json({ error: "Song ID is required" });
      }

      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ message: "Song deleted successfully" });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
