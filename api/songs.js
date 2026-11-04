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

/* Parse JSON body asynchronously (supports pre-parsed objects, strings, Buffers, and raw streams) */
async function parseBody(req) {
  // 1. If already parsed by middleware or Vercel
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  // 2. If body is a string or Buffer
  if (req.body != null) {
    try {
      const text = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : String(req.body);
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  // 3. If stream, read incoming chunks
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw || !raw.trim()) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
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

      const payload = (await parseBody(req)) || {};

      const title = (payload.title || req.query?.title || "").trim();
      const artist = (payload.artist || req.query?.artist || "").trim();
      const file = (payload.file || req.query?.file || "").trim();
      const cover = (payload.cover || req.query?.cover || "").trim();
      const lyrics = (payload.lyrics != null ? String(payload.lyrics) : (req.query?.lyrics || "")).trim();

      if (!title || !artist || !file || !cover) {
        return res.status(400).json({
          error: "title, artist, file, and cover are required",
        });
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

      const body = (await parseBody(req)) || {};
      const id = req.query?.id || body?.id;

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
