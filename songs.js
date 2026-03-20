import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url =
    process.env.SUPABASE_URL || "https://pnysywzorgsomfvpuvic.supabase.co";
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueXN5d3pvcmdzb21mdnB1dmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTU2NTcsImV4cCI6MjA4OTQ5MTY1N30.8_trlRVo5AtedeVEIT6ZDg2i3qVe11QBK-NZKC86xHI";

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return res.status(500).json({
        error:
          "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Add them to your environment variables.",
      });
    }

    // GET all songs
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return res.status(200).json(data);
    }

    // ADD song
    if (req.method === "POST") {
      const { title, artist, file, cover, lyrics } = req.body;
      if (!title || !artist || !file || !cover) {
        return res.status(400).json({
          error: "title, artist, file, and cover are required",
        });
      }

      const { data, error } = await supabase
        .from("songs")
        .insert([{ title, artist, file, cover, lyrics }])
        .select();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE song
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return res.status(200).json({ message: "Deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
