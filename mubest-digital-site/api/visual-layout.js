import { ensureSchema, query, audit } from "../lib/db.js";
import { requireAdmin, assertSameOrigin } from "../lib/auth.js";

const PAGES = new Set(["home", "about", "services", "portfolio", "contact"]);
const TYPES = new Set(["heading", "text", "image", "button", "video", "review", "section", "divider", "social"]);
const STYLE_KEYS = new Set(["color", "backgroundColor", "fontSize", "fontWeight", "textAlign", "width", "maxWidth", "height", "minHeight", "padding", "paddingTop", "paddingBottom", "margin", "marginTop", "marginBottom", "marginLeft", "marginRight", "borderRadius", "objectFit", "alignSelf", "justifySelf", "display", "translate", "zIndex", "opacity"]);
const EMPTY = { version: 1, patches: [], added: [], moves: [] };
const json = (res, status, data) => { res.setHeader("Cache-Control", "no-store"); return res.status(status).json(data); };
const str = (v, max = 2000) => String(v ?? "").trim().slice(0, max);

function selector(value, optional = false) {
  const s = str(value, 900);
  if (!s && optional) return "";
  if (!s || /[<>;{}]|javascript:|url\s*\(/i.test(s)) throw new Error("Invalid element selector.");
  return s;
}
function safeUrl(value, allowContact = false) {
  const v = str(value, 2500);
  if (!v) return "";
  if (/^https:\/\//i.test(v) || /^\/(?!\/)/.test(v) || (allowContact && /^(mailto:|tel:)/i.test(v))) return v;
  throw new Error("Use a secure https URL or a local website path.");
}
function cleanStyles(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, raw] of Object.entries(value)) {
    if (!STYLE_KEYS.has(key)) continue;
    const v = str(raw, 100);
    if (!v || /[<>;{}]|url\s*\(|expression\s*\(|javascript:/i.test(v)) continue;
    out[key] = v;
  }
  return out;
}
const DEVICES = ["desktop", "tablet", "mobile"];
const GEOMETRY_KEYS = new Set(["translate","width","height","minHeight","maxWidth","zIndex"]);
function cleanDeviceStyles(value) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const device of DEVICES) {
    const values = cleanStyles(value[device]);
    const safe = Object.fromEntries(Object.entries(values).filter(([key]) => GEOMETRY_KEYS.has(key)));
    if (Object.keys(safe).length) result[device] = safe;
  }
  return result;
}
function cleanLayout(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The editor data is invalid.");
  const patches = Array.isArray(input.patches) ? input.patches : [];
  const added = Array.isArray(input.added) ? input.added : [];
  const moves = Array.isArray(input.moves) ? input.moves : [];
  if (patches.length > 250 || added.length > 100 || moves.length > 250) throw new Error("This page has reached the visual editor item limit.");
  const patchRows = patches.map(p => {
    const row = { selector: selector(p.selector), styles: cleanStyles(p.styles), deviceStyles: cleanDeviceStyles(p.deviceStyles) };
    if (Object.hasOwn(p, "text")) row.text = str(p.text, 6000);
    if (Object.hasOwn(p, "href")) row.href = safeUrl(p.href, true);
    if (Object.hasOwn(p, "src")) row.src = safeUrl(p.src);
    if (Object.hasOwn(p, "alt")) row.alt = str(p.alt, 500);
    if (Object.hasOwn(p, "hidden")) row.hidden = p.hidden === true;
    return row;
  });
  const ids = new Set();
  const addedRows = added.map(item => {
    const id = str(item.id, 80).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!id || ids.has(id)) throw new Error("Added element IDs must be unique.");
    ids.add(id);
    const type = str(item.type, 20);
    if (!TYPES.has(type)) throw new Error("This element type is not supported.");
    return {
      id, type,
      parentSelector: selector(item.parentSelector),
      beforeSelector: selector(item.beforeSelector, true),
      text: str(item.text, 3000), body: str(item.body, 5000),
      href: item.href ? safeUrl(item.href, true) : "",
      src: item.src ? safeUrl(item.src) : "",
      alt: str(item.alt, 500),
      links: type === "social" ? Object.fromEntries(
        Object.entries(item.links && typeof item.links === "object" && !Array.isArray(item.links) ? item.links : {})
          .filter(([key]) => ["instagram","linkedin","facebook","tiktok","youtube","x","pinterest","whatsapp"].includes(key))
          .map(([key,value]) => [key, value ? safeUrl(value) : ""])
          .filter(([key,value]) => /^https:\/\//i.test(value))
      ) : {},
      styles: cleanStyles(item.styles),
      deviceStyles: cleanDeviceStyles(item.deviceStyles),
      hidden: item.hidden === true
    };
  });
  const moveRows = moves.map(move => ({
    selector: selector(move.selector),
    parentSelector: selector(move.parentSelector),
    beforeSelector: selector(move.beforeSelector, true)
  }));
  return { version: 1, patches: patchRows, added: addedRows, moves: moveRows };
}

async function ensureVisualTable() {
  await query(`CREATE TABLE IF NOT EXISTS visual_page_layouts (
    slug TEXT PRIMARY KEY CHECK (slug IN ('home','about','services','portfolio','contact')),
    draft JSONB NOT NULL DEFAULT '{"version":1,"patches":[],"added":[],"moves":[]}'::jsonb,
    published JSONB NOT NULL DEFAULT '{"version":1,"patches":[],"added":[],"moves":[]}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
  )`);
}

export default async function handler(req, res) {
  try {
    await ensureSchema();
    await ensureVisualTable();
    if (req.method === "GET") {
      const url = new URL(req.url, "https://local.invalid");
      const page = url.searchParams.get("page") || "home";
      const mode = url.searchParams.get("mode") || "public";
      if (!PAGES.has(page)) return json(res, 400, { error: "Unknown page." });
      if (mode === "editor") {
        const admin = await requireAdmin(req);
        if (!admin) return json(res, 401, { error: "Please sign in to open the visual editor." });
        const [row] = await query("SELECT draft,published,updated_at,published_at FROM visual_page_layouts WHERE slug=$1", [page]);
        return json(res, 200, { data: { page, layout: row?.draft || row?.published || EMPTY, published: row?.published || EMPTY, updated_at: row?.updated_at || null } });
      }
      const [row] = await query("SELECT published FROM visual_page_layouts WHERE slug=$1", [page]);
      return json(res, 200, { data: { page, layout: row?.published || EMPTY } });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    const admin = await requireAdmin(req);
    if (!admin) return json(res, 401, { error: "Please sign in to save visual changes." });
    assertSameOrigin(req);
    const body = req.body || {};
    const page = str(body.page, 30);
    const action = str(body.action, 30);
    if (!PAGES.has(page)) return json(res, 400, { error: "Unknown page." });
    if (!["draft", "publish"].includes(action)) return json(res, 400, { error: "Unsupported visual editor action." });
    if (JSON.stringify(body.layout || {}).length > 500000) return json(res, 413, { error: "This page layout is too large to save. Remove a few large elements and try again." });
    const layout = cleanLayout(body.layout);
    const serialized = JSON.stringify(layout);
    const [row] = await query(
      `INSERT INTO visual_page_layouts (slug,draft,published,updated_at,published_at)
       VALUES ($1,$2::jsonb,CASE WHEN $3 THEN $2::jsonb ELSE $4::jsonb END,NOW(),CASE WHEN $3 THEN NOW() ELSE NULL END)
       ON CONFLICT (slug) DO UPDATE SET
         draft=EXCLUDED.draft,
         published=CASE WHEN $3 THEN EXCLUDED.published ELSE visual_page_layouts.published END,
         updated_at=NOW(),
         published_at=CASE WHEN $3 THEN NOW() ELSE visual_page_layouts.published_at END
       RETURNING slug,draft,published,updated_at,published_at`,
      [page, serialized, action === "publish", JSON.stringify(EMPTY)]
    );
    await audit(admin.user_id, action === "publish" ? "published" : "saved draft", "visual_layout", page, `${action === "publish" ? "Published" : "Saved draft for"} the ${page} visual layout.`);
    return json(res, 200, { data: { page, layout: action === "publish" ? row.published : row.draft, published_at: row.published_at } });
  } catch (error) {
    console.error("Visual layout API:", error);
    return json(res, error.statusCode || 500, { error: error.message || "The visual layout could not be saved." });
  }
}
