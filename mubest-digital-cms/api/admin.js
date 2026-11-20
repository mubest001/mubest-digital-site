import { del } from "@vercel/blob";
import { ensureSchema, query, audit, revision } from "../lib/db.js";
import { requireAdmin, assertSameOrigin } from "../lib/auth.js";

const TABLES = {
  portfolio: "portfolio_projects",
  services: "services",
  testimonials: "testimonials",
  faqs: "faqs"
};

const json = (res, status, data) => {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(data);
};

const text = (v, max = 6000) => String(v ?? "").trim().slice(0, max);
const number = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const bool = v => v === true || v === "true" || v === "on" || v === 1;
const array = v => Array.isArray(v) ? v : String(v || "").split(/\r?\n|,/).map(x => x.trim()).filter(Boolean);
const slugify = v => text(v, 180).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

async function getResource(resource) {
  if (resource === "overview") {
    const [p,s,l,d,m] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM portfolio_projects WHERE status='published'"),
      query("SELECT COUNT(*)::int AS count FROM services WHERE status='published'"),
      query("SELECT COUNT(*)::int AS count FROM leads WHERE status='new'"),
      query("SELECT COUNT(*)::int AS count FROM portfolio_projects WHERE status='draft'"),
      query("SELECT COUNT(*)::int AS count FROM media_assets")
    ]);
    const recent = await query("SELECT id,name,email,service,status,created_at FROM leads ORDER BY created_at DESC LIMIT 6");
    return { counts:{portfolio:p[0].count,services:s[0].count,new_leads:l[0].count,drafts:d[0].count,media:m[0].count}, recent };
  }
  if (resource === "settings") {
    const rows = await query("SELECT key,value FROM site_settings ORDER BY key");
    return Object.fromEntries(rows.map(row => [row.key,row.value]));
  }
  if (resource === "pages") return await query("SELECT slug,draft,published,status,updated_at,published_at FROM site_pages ORDER BY slug");
  if (resource === "portfolio") return await query("SELECT * FROM portfolio_projects ORDER BY sort_order ASC,id DESC");
  if (resource === "services") return await query("SELECT * FROM services ORDER BY sort_order ASC,id ASC");
  if (resource === "testimonials") return await query("SELECT * FROM testimonials ORDER BY sort_order ASC,id DESC");
  if (resource === "faqs") return await query("SELECT * FROM faqs ORDER BY sort_order ASC,id ASC");
  if (resource === "media") return await query("SELECT * FROM media_assets ORDER BY created_at DESC");
  if (resource === "leads") return await query("SELECT * FROM leads ORDER BY created_at DESC");
  if (resource === "activity") {
    const [logs,revisions] = await Promise.all([
      query("SELECT a.*,u.email FROM audit_logs a LEFT JOIN admin_users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 80"),
      query("SELECT r.id,r.entity_type,r.entity_id,r.created_at,u.email FROM content_revisions r LEFT JOIN admin_users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 40")
    ]);
    return { logs,revisions };
  }
  return null;
}

async function saveRecord(resource, data, admin) {
  const table = TABLES[resource];
  if (!table) throw new Error("Unknown content type.");
  const id = data.id ? number(data.id) : null;
  const status = ["draft","published","archived"].includes(data.status) ? data.status : "draft";
  let row;

  if (resource === "portfolio") {
    const fields = [
      text(data.slug,180) || slugify(data.title), text(data.title,180), text(data.category,180),
      text(data.excerpt,500), text(data.description,10000), text(data.cover_image,2000),
      JSON.stringify(array(data.gallery)), text(data.project_url,2000), bool(data.featured),
      number(data.sort_order), status
    ];
    if (!fields[0] || !fields[1]) throw new Error("Project title and slug are required.");
    if (id) {
      const [old] = await query("SELECT * FROM portfolio_projects WHERE id=$1",[id]);
      if (!old) throw new Error("Project not found.");
      await revision(admin.user_id,resource,id,old);
      [row] = await query(
        `UPDATE portfolio_projects SET slug=$1,title=$2,category=$3,excerpt=$4,description=$5,cover_image=$6,gallery=$7::jsonb,project_url=$8,featured=$9,sort_order=$10,status=$11,updated_at=NOW(),published_at=CASE WHEN $11='published' THEN COALESCE(published_at,NOW()) ELSE published_at END WHERE id=$12 RETURNING *`,
        [...fields,id]
      );
    } else {
      [row] = await query(
        `INSERT INTO portfolio_projects (slug,title,category,excerpt,description,cover_image,gallery,project_url,featured,sort_order,status,published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,CASE WHEN $11='published' THEN NOW() ELSE NULL END) RETURNING *`,
        fields
      );
    }
  }

  if (resource === "services") {
    const fields = [
      text(data.slug,180) || slugify(data.title), text(data.title,180), text(data.summary,600),
      text(data.description,10000), text(data.tag,220), text(data.icon,40) || "website",
      JSON.stringify(array(data.deliverables)), number(data.sort_order), status
    ];
    if (!fields[0] || !fields[1]) throw new Error("Service title and slug are required.");
    if (id) {
      const [old] = await query("SELECT * FROM services WHERE id=$1",[id]);
      if (!old) throw new Error("Service not found.");
      await revision(admin.user_id,resource,id,old);
      [row] = await query(
        `UPDATE services SET slug=$1,title=$2,summary=$3,description=$4,tag=$5,icon=$6,deliverables=$7::jsonb,sort_order=$8,status=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
        [...fields,id]
      );
    } else {
      [row] = await query(
        `INSERT INTO services (slug,title,summary,description,tag,icon,deliverables,sort_order,status) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) RETURNING *`,
        fields
      );
    }
  }

  if (resource === "testimonials") {
    const fields = [text(data.name,180),text(data.role,180),text(data.company,180),text(data.quote,5000),text(data.avatar_url,2000),Math.min(5,Math.max(1,number(data.rating,5))),number(data.sort_order),status];
    if (!fields[0] || !fields[3]) throw new Error("A name and testimonial quote are required.");
    if (id) {
      const [old] = await query("SELECT * FROM testimonials WHERE id=$1",[id]);
      if (!old) throw new Error("Testimonial not found.");
      await revision(admin.user_id,resource,id,old);
      [row] = await query("UPDATE testimonials SET name=$1,role=$2,company=$3,quote=$4,avatar_url=$5,rating=$6,sort_order=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *",[...fields,id]);
    } else {
      [row] = await query("INSERT INTO testimonials (name,role,company,quote,avatar_url,rating,sort_order,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",fields);
    }
  }

  if (resource === "faqs") {
    const fields = [text(data.question,600),text(data.answer,5000),number(data.sort_order),status];
    if (!fields[0] || !fields[1]) throw new Error("Both question and answer are required.");
    if (id) {
      const [old] = await query("SELECT * FROM faqs WHERE id=$1",[id]);
      if (!old) throw new Error("FAQ not found.");
      await revision(admin.user_id,resource,id,old);
      [row] = await query("UPDATE faqs SET question=$1,answer=$2,sort_order=$3,status=$4,updated_at=NOW() WHERE id=$5 RETURNING *",[...fields,id]);
    } else {
      [row] = await query("INSERT INTO faqs (question,answer,sort_order,status) VALUES ($1,$2,$3,$4) RETURNING *",fields);
    }
  }

  await audit(admin.user_id,id ? "updated" : "created",resource,row.id,`Saved ${resource} item: ${row.title || row.name || row.question}.`);
  return row;
}

async function deleteRecord(resource, id, admin) {
  const table = TABLES[resource];
  if (!table) throw new Error("This item cannot be deleted here.");
  const [old] = await query(`SELECT * FROM ${table} WHERE id=$1`,[id]);
  if (!old) throw new Error("Item not found.");
  await revision(admin.user_id,resource,id,old);
  await query(`DELETE FROM ${table} WHERE id=$1`,[id]);
  await audit(admin.user_id,"deleted",resource,id,`Deleted ${resource} item.`);
  return { ok:true };
}

async function savePage(data, admin, publish = false) {
  const slug = text(data.slug,40);
  const content = data.content && typeof data.content === "object" ? data.content : {};
  if (!["home","about","services","portfolio","contact"].includes(slug)) throw new Error("Unknown page.");
  const [old] = await query("SELECT * FROM site_pages WHERE slug=$1",[slug]);
  if (old) await revision(admin.user_id,"pages",slug,old);
  const contentJson = JSON.stringify(content);
  const [row] = await query(
    `INSERT INTO site_pages (slug,draft,published,status,updated_at,published_at)
     VALUES ($1,$2::jsonb,$2::jsonb,CASE WHEN $3 THEN 'published' ELSE 'draft' END,NOW(),CASE WHEN $3 THEN NOW() ELSE NULL END)
     ON CONFLICT (slug) DO UPDATE SET
       draft=EXCLUDED.draft,
       published=CASE WHEN $3 THEN EXCLUDED.published ELSE site_pages.published END,
       status=CASE WHEN $3 THEN 'published' ELSE site_pages.status END,
       updated_at=NOW(),
       published_at=CASE WHEN $3 THEN NOW() ELSE site_pages.published_at END
     RETURNING *`,
    [slug,contentJson,publish]
  );
  await audit(admin.user_id,publish ? "published" : "saved draft","pages",slug,`${publish ? "Published" : "Saved draft for"} the ${slug} page.`);
  return row;
}

async function saveSettings(data, admin) {
  const allowed = new Set([
    "site_name","logo_url","favicon_url","about_image_url","contact_email","phone","whatsapp","location",
    "seo_title","seo_description","social_instagram","social_linkedin","social_facebook","social_tiktok",
    "color_ink","color_blue","color_lime","color_paper","font_heading","font_body"
  ]);
  for (const [key,value] of Object.entries(data || {})) {
    if (!allowed.has(key)) continue;
    const [old] = await query("SELECT value FROM site_settings WHERE key=$1",[key]);
    if (old) await revision(admin.user_id,"settings",key,{key,value:old.value});
    await query(
      "INSERT INTO site_settings (key,value) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",
      [key,JSON.stringify(value)]
    );
  }
  await audit(admin.user_id,"updated","settings","global","Updated website settings.");
  return { ok:true };
}

async function restoreRevision(id, admin) {
  const [rev] = await query("SELECT * FROM content_revisions WHERE id=$1",[id]);
  if (!rev) throw new Error("Revision not found.");
  const snap = rev.snapshot || {};
  const entity = rev.entity_type;
  if (entity === "settings") {
    await query("INSERT INTO site_settings (key,value) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[snap.key,JSON.stringify(snap.value)]);
  } else if (entity === "pages") {
    await query(
      `INSERT INTO site_pages (slug,draft,published,status,updated_at,published_at)
       VALUES ($1,$2::jsonb,$3::jsonb,$4,NOW(),$5)
       ON CONFLICT (slug) DO UPDATE SET draft=EXCLUDED.draft,published=EXCLUDED.published,status=EXCLUDED.status,updated_at=NOW(),published_at=EXCLUDED.published_at`,
      [snap.slug,JSON.stringify(snap.draft || {}),JSON.stringify(snap.published || {}),snap.status || "draft",snap.published_at || null]
    );
  } else if (entity === "portfolio") {
    await query(
      `INSERT INTO portfolio_projects (id,slug,title,category,excerpt,description,cover_image,gallery,project_url,featured,sort_order,status,created_at,updated_at,published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,COALESCE($13,NOW()),NOW(),$14)
       ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,category=EXCLUDED.category,excerpt=EXCLUDED.excerpt,description=EXCLUDED.description,cover_image=EXCLUDED.cover_image,gallery=EXCLUDED.gallery,project_url=EXCLUDED.project_url,featured=EXCLUDED.featured,sort_order=EXCLUDED.sort_order,status=EXCLUDED.status,updated_at=NOW(),published_at=EXCLUDED.published_at`,
      [Number(rev.entity_id),snap.slug,snap.title,snap.category,snap.excerpt,snap.description,snap.cover_image,JSON.stringify(snap.gallery || []),snap.project_url,snap.featured,snap.sort_order,snap.status,snap.created_at,snap.published_at]
    );
  } else if (entity === "services") {
    await query(
      `INSERT INTO services (id,slug,title,summary,description,tag,icon,deliverables,sort_order,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,COALESCE($11,NOW()),NOW())
       ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,summary=EXCLUDED.summary,description=EXCLUDED.description,tag=EXCLUDED.tag,icon=EXCLUDED.icon,deliverables=EXCLUDED.deliverables,sort_order=EXCLUDED.sort_order,status=EXCLUDED.status,updated_at=NOW()`,
      [Number(rev.entity_id),snap.slug,snap.title,snap.summary,snap.description,snap.tag,snap.icon,JSON.stringify(snap.deliverables || []),snap.sort_order,snap.status,snap.created_at]
    );
  } else if (entity === "testimonials") {
    await query(
      `INSERT INTO testimonials (id,name,role,company,quote,avatar_url,rating,sort_order,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,NOW()),NOW())
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,role=EXCLUDED.role,company=EXCLUDED.company,quote=EXCLUDED.quote,avatar_url=EXCLUDED.avatar_url,rating=EXCLUDED.rating,sort_order=EXCLUDED.sort_order,status=EXCLUDED.status,updated_at=NOW()`,
      [Number(rev.entity_id),snap.name,snap.role,snap.company,snap.quote,snap.avatar_url,snap.rating,snap.sort_order,snap.status,snap.created_at]
    );
  } else if (entity === "faqs") {
    await query("INSERT INTO faqs (id,question,answer,sort_order,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,COALESCE($6,NOW()),NOW()) ON CONFLICT (id) DO UPDATE SET question=EXCLUDED.question,answer=EXCLUDED.answer,sort_order=EXCLUDED.sort_order,status=EXCLUDED.status,updated_at=NOW()",[Number(rev.entity_id),snap.question,snap.answer,snap.sort_order,snap.status,snap.created_at]);
  } else {
    throw new Error("This revision type cannot be restored.");
  }
  await audit(admin.user_id,"restored",entity,rev.entity_id,`Restored a previous ${entity} version.`);
  return { ok:true };
}

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const admin = await requireAdmin(req);
    if (!admin) return json(res,401,{ error:"Please sign in to use the admin dashboard." });

    if (req.method === "GET") {
      const resource = new URL(req.url,"https://local.invalid").searchParams.get("resource") || "overview";
      const data = await getResource(resource);
      if (data === null) return json(res,400,{error:"Unknown dashboard section."});
      return json(res,200,{data});
    }

    if (req.method !== "POST") return json(res,405,{error:"Method not allowed."});
    assertSameOrigin(req);
    const body = req.body || {};
    const resource = body.resource;
    const action = body.action || "save";
    let result;

    if (["portfolio","services","testimonials","faqs"].includes(resource) && action === "save") {
      result = await saveRecord(resource,body.data || {},admin);
    } else if (["portfolio","services","testimonials","faqs"].includes(resource) && action === "delete") {
      result = await deleteRecord(resource,number(body.id),admin);
    } else if (resource === "pages" && ["save","publish"].includes(action)) {
      result = await savePage(body.data || {},admin,action === "publish");
    } else if (resource === "settings" && action === "save") {
      result = await saveSettings(body.data || {},admin);
    } else if (resource === "media" && action === "create") {
      const d = body.data || {};
      const [row] = await query(
        "INSERT INTO media_assets (url,pathname,filename,content_type,size_bytes,alt_text) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (url) DO UPDATE SET filename=EXCLUDED.filename RETURNING *",
        [text(d.url,3000),text(d.pathname,1000),text(d.filename,255),text(d.content_type,120),number(d.size_bytes),text(d.alt_text,500)]
      );
      await audit(admin.user_id,"uploaded","media",row.id,`Uploaded ${row.filename || "a media file"}.`);
      result = row;
    } else if (resource === "media" && action === "delete") {
      const [asset] = await query("SELECT * FROM media_assets WHERE id=$1",[number(body.id)]);
      if (!asset) throw new Error("Media item not found.");
      if (asset.url.includes(".blob.vercel-storage.com") && process.env.BLOB_READ_WRITE_TOKEN) await del(asset.url);
      await query("DELETE FROM media_assets WHERE id=$1",[asset.id]);
      await audit(admin.user_id,"deleted","media",asset.id,`Deleted ${asset.filename || "a media file"}.`);
      result = {ok:true};
    } else if (resource === "leads" && action === "update") {
      const status = ["new","contacted","in_progress","completed","archived"].includes(body.status) ? body.status : "new";
      const [row] = await query("UPDATE leads SET status=$1,notes=$2 WHERE id=$3 RETURNING *",[status,text(body.notes,4000),number(body.id)]);
      if (!row) throw new Error("Enquiry not found.");
      await audit(admin.user_id,"updated","lead",row.id,`Updated enquiry status to ${status}.`);
      result = row;
    } else if (resource === "activity" && action === "restore") {
      result = await restoreRevision(number(body.id),admin);
    } else {
      return json(res,400,{error:"Unsupported dashboard action."});
    }

    return json(res,200,{data:result});
  } catch (error) {
    console.error("Admin API:",error);
    return json(res,error.statusCode || 500,{error:error.message || "The requested change could not be saved."});
  }
}
