import { ensureSchema, query, audit } from "../lib/db.js";
import { requireAdmin, assertSameOrigin } from "../lib/auth.js";
const json = (res, status, data) => { res.setHeader("Cache-Control", "no-store"); return res.status(status).json(data); };

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const admin = await requireAdmin(req);
    if (!admin) return json(res, 401, { error: "Please sign in to manage analytics settings." });
    if (req.method === "GET") {
      const [row] = await query("SELECT value FROM site_settings WHERE key='analytics_script_url'");
      return json(res, 200, { data: { scriptUrl: row?.value || "" } });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    assertSameOrigin(req);
    const scriptUrl = String(req.body?.scriptUrl || "").trim();
    if (scriptUrl && (!/^\/(?!\/)[A-Za-z0-9._~/-]+\/script\.js(?:\?[A-Za-z0-9._~=&%-]+)?$/.test(scriptUrl) || /\.\.|javascript:/i.test(scriptUrl))) {
      return json(res, 400, { error: "Enter the Vercel script path beginning with / and ending in /script.js." });
    }
    await query("INSERT INTO site_settings (key,value) VALUES ('analytics_script_url',$1::jsonb) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()", [JSON.stringify(scriptUrl)]);
    await audit(admin.user_id, "updated", "analytics", "tracking-script", scriptUrl ? "Updated the Vercel Web Analytics script path." : "Removed the Vercel Web Analytics script path.");
    return json(res, 200, { data: { scriptUrl } });
  } catch (error) {
    console.error("Analytics config API:", error);
    return json(res, error.statusCode || 500, { error: error.message || "Analytics settings could not be saved." });
  }
}
