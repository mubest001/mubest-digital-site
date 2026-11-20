import { ensureSchema, query } from "../lib/db.js";

const PUBLIC_SETTINGS = [
  "site_name","logo_url","favicon_url","about_image_url",
  "contact_email","phone","whatsapp","location",
  "seo_title","seo_description","seo_image_url","social_instagram",
  "social_linkedin","social_facebook","social_tiktok","color_ink",
  "color_blue","color_lime","color_paper","font_heading",
  "font_body","hero_video_enabled","hero_video_url","hero_poster_url",
  "availability_enabled","availability_text","show_home_services","show_home_work",
  "show_home_process","show_home_about","show_home_faq","show_home_testimonials",
  "show_home_cta","header_cta_label","header_cta_url","nav_home_label",
  "nav_about_label","nav_services_label","nav_portfolio_label","nav_contact_label",
  "announcement_enabled","announcement_text","announcement_link_label","announcement_url",
  "footer_tagline","footer_note","footer_cta_label","layout_sections"
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  try {
    await ensureSchema();
    const [settingsRows, pageRows, portfolio, services, testimonials, faqs] = await Promise.all([
      query("SELECT key,value FROM site_settings WHERE key = ANY($1::text[])", [PUBLIC_SETTINGS]),
      query("SELECT slug,published FROM site_pages WHERE status='published'"),
      query("SELECT id,slug,title,category,excerpt,description,cover_image,gallery,project_url,featured,sort_order,details FROM portfolio_projects WHERE status='published' ORDER BY featured DESC,sort_order ASC,created_at DESC"),
      query("SELECT id,slug,title,summary,description,tag,icon,deliverables,sort_order FROM services WHERE status='published' ORDER BY sort_order ASC,id ASC"),
      query("SELECT id,name,role,company,quote,avatar_url,rating,sort_order FROM testimonials WHERE status='published' ORDER BY sort_order ASC,id DESC"),
      query("SELECT id,question,answer,sort_order FROM faqs WHERE status='published' ORDER BY sort_order ASC,id ASC")
    ]);

    const settings = Object.fromEntries(settingsRows.map(row => [row.key, row.value]));
    const pages = Object.fromEntries(pageRows.map(row => [row.slug, row.published || {}]));
    return res.status(200).json({ settings, pages, portfolio, services, testimonials, faqs });
  } catch (error) {
    console.error("Public content API:", error);
    return res.status(503).json({ error: "Website content is temporarily unavailable." });
  }
}
