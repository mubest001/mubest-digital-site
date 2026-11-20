import { ensureSchema, query } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";

const json = (res, status, data) => { res.setHeader("Cache-Control", "private, no-store"); return res.status(status).json(data); };
const RANGES = { "24h": 24 * 60 * 60 * 1000, "7d": 7 * 24 * 60 * 60 * 1000, "30d": 30 * 24 * 60 * 60 * 1000 };

async function analyticsRequest(resource, params, token) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/visits/${resource}`);
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error?.message || body?.message || `Vercel Analytics returned ${response.status}.`);
    error.statusCode = response.status;
    throw error;
  }
  return body?.data ?? {};
}

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const admin = await requireAdmin(req);
    if (!admin) return json(res, 401, { error: "Please sign in to view website analytics." });
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });

    const url = new URL(req.url, "https://local.invalid");
    const range = RANGES[url.searchParams.get("range")] ? url.searchParams.get("range") : "24h";
    const token = process.env.VERCEL_ANALYTICS_TOKEN;
    const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID;
    const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID;
    const [scriptRow] = await query("SELECT value FROM site_settings WHERE key='analytics_script_url'");
    const trackingConfigured = Boolean(scriptRow?.value);
    const missing = [];
    if (!token) missing.push("VERCEL_ANALYTICS_TOKEN");
    if (!projectId) missing.push("VERCEL_ANALYTICS_PROJECT_ID");
    if (missing.length) return json(res, 200, { data: { setupRequired: true, missing, trackingConfigured } });

    const until = new Date();
    const since = new Date(until.getTime() - RANGES[range]);
    const common = { projectId, teamId, since: since.toISOString(), until: until.toISOString() };
    const timeGroup = range === "24h" ? "hour" : "day";
    const results = await Promise.allSettled([
      analyticsRequest("count", common, token),
      analyticsRequest("aggregate", { ...common, by: timeGroup, limit: 48 }, token),
      analyticsRequest("aggregate", { ...common, by: "country", limit: 12 }, token),
      analyticsRequest("aggregate", { ...common, by: "requestPath", limit: 10 }, token),
      analyticsRequest("aggregate", { ...common, by: "referrerHostname", limit: 10 }, token),
      analyticsRequest("aggregate", { ...common, by: "deviceType", limit: 6 }, token),
      query("SELECT COUNT(*)::int AS count FROM leads WHERE created_at >= $1", [since.toISOString()])
    ]);
    const totalsResult = results[0];
    if (totalsResult.status === "rejected") throw totalsResult.reason;
    const value = index => results[index].status === "fulfilled" ? results[index].value : [];
    const totals = totalsResult.value || {};
    const leadRows = value(6);
    return json(res, 200, { data: {
      setupRequired: false, trackingConfigured, range,
      visitors: Number(totals.visitors || 0), pageviews: Number(totals.pageviews || 0),
      enquiries: Number(leadRows[0]?.count || 0),
      hourly: Array.isArray(value(1)) ? value(1) : [],
      countries: Array.isArray(value(2)) ? value(2) : [],
      pages: Array.isArray(value(3)) ? value(3) : [],
      referrers: Array.isArray(value(4)) ? value(4) : [],
      devices: Array.isArray(value(5)) ? value(5) : [],
      since: since.toISOString(), until: until.toISOString(), generatedAt: new Date().toISOString(),
      partial: results.slice(1).some(x => x.status === "rejected")
    } });
  } catch (error) {
    console.error("Analytics API:", error);
    let message = error.message || "Analytics could not be loaded.";
    if (error.statusCode === 401 || error.statusCode === 403) message = "Vercel rejected the analytics token. Check that it has access to read Web Analytics for this project and team.";
    else if (error.statusCode === 404) message = "Web Analytics is not enabled for this Vercel project yet. Enable it in Vercel, then redeploy the site.";
    return json(res, error.statusCode === 401 || error.statusCode === 403 ? 502 : 503, { error: message });
  }
}
