export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers?.authorization;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return res.status(500).json({ success: false, error: "Missing SUPABASE_URL" });
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/keep-alive`;
  const response = await fetch(edgeFunctionUrl, {
    method: "GET",
    headers: {
      Authorization: cronSecret ? `Bearer ${cronSecret}` : "",
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return res.status(response.status).json(
    data ?? { success: response.ok }
  );
}
