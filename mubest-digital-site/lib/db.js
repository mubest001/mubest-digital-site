import { BLOG_STARTERS } from './blog-starters.js';
import { SERVICE_CATALOGUE, SERVICE_PORTFOLIO_CATEGORIES } from './service-catalogue.js';
import { neon } from "@neondatabase/serverless";
import { DEFAULT_SETTINGS, DEFAULT_PAGES, DEFAULT_SERVICES, DEFAULT_PORTFOLIO, DEFAULT_FAQS } from "./defaults.js";

let sqlClient;
let schemaPromise;

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured in Vercel.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function query(statement, params = []) {
  return db().query(statement, params);
}

const schema = [
`CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions(expires_at)`,
`CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS site_pages (
  slug TEXT PRIMARY KEY,
  draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  published JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
)`,
`CREATE TABLE IF NOT EXISTS portfolio_projects (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  project_url TEXT DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
)`,
`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb`, 
`CREATE TABLE IF NOT EXISTS portfolio_engagement (
 event_id UUID PRIMARY KEY, project_id BIGINT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
 visitor_id UUID NOT NULL, event_type TEXT NOT NULL CHECK(event_type IN ('impression','click','view','video_play','video_complete','contact','engagement')),
 seconds INTEGER NOT NULL DEFAULT 0 CHECK(seconds BETWEEN 0 AND 1800),
 source TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', device TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE INDEX IF NOT EXISTS portfolio_engagement_date_idx ON portfolio_engagement(created_at,project_id)`,
`CREATE INDEX IF NOT EXISTS portfolio_engagement_visitor_idx ON portfolio_engagement(visitor_id,created_at)`,
`CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tag TEXT DEFAULT '',
  icon TEXT DEFAULT 'website',
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS testimonials (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  company TEXT DEFAULT '',
  quote TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS faqs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS media_assets (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  pathname TEXT DEFAULT '',
  filename TEXT DEFAULT '',
  content_type TEXT DEFAULT '',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  alt_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  service TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS ai_chat_usage (
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  visitor_hash TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(day,visitor_hash)
)`,
 `CREATE TABLE IF NOT EXISTS blog_posts (
 id BIGSERIAL PRIMARY KEY,slug TEXT NOT NULL UNIQUE,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT '',service TEXT NOT NULL DEFAULT '',body TEXT NOT NULL DEFAULT '',source TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),published_at TIMESTAMPTZ
)`,
`CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS content_revisions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`
];

async function seed() {
  const sql = db();
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await sql.query(
      "INSERT INTO site_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING",
      [key, JSON.stringify(value)]
    );
  }
  for (const [slug, content] of Object.entries(DEFAULT_PAGES)) {
    await sql.query(
      "INSERT INTO site_pages (slug, draft, published, status, published_at) VALUES ($1, $2::jsonb, $2::jsonb, 'published', NOW()) ON CONFLICT (slug) DO NOTHING",
      [slug, JSON.stringify(content)]
    );
  }
  for (const item of DEFAULT_SERVICES) {
    await sql.query(
      `INSERT INTO services (slug,title,summary,description,tag,icon,deliverables,sort_order,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) ON CONFLICT (slug) DO NOTHING`,
      [item.slug,item.title,item.summary,item.description,item.tag,item.icon,JSON.stringify(item.deliverables),item.sort_order,item.status]
    );
  }
  // Atomic, one-time additive catalogue migration. Preserve existing copy, status and custom services.
  await sql.query(`
    WITH migration AS (
      INSERT INTO site_settings(key,value) VALUES ('service_catalogue_v2_applied','true'::jsonb)
      ON CONFLICT(key) DO NOTHING RETURNING key
    ), incoming AS (
      SELECT * FROM jsonb_to_recordset($1::jsonb) AS r(slug text,title text,summary text,description text,tag text,icon text,deliverables jsonb,sort_order integer,status text)
    ), merged AS (
      INSERT INTO services(slug,title,summary,description,tag,icon,deliverables,sort_order,status)
      SELECT i.slug,i.title,i.summary,i.description,i.tag,i.icon,i.deliverables,i.sort_order,i.status FROM incoming i CROSS JOIN migration
      ON CONFLICT(slug) DO UPDATE SET deliverables=(
        SELECT COALESCE(jsonb_agg(val ORDER BY first_ord),'[]'::jsonb) FROM (
          SELECT val,MIN(ord) AS first_ord FROM jsonb_array_elements(COALESCE(services.deliverables,'[]'::jsonb)||EXCLUDED.deliverables) WITH ORDINALITY AS x(val,ord) GROUP BY val
        ) unique_items
      ),updated_at=NOW() RETURNING id
    )
    UPDATE site_settings s SET value=(
      SELECT COALESCE(jsonb_agg(val ORDER BY first_ord),'[]'::jsonb) FROM (
        SELECT val,MIN(ord) AS first_ord FROM jsonb_array_elements(COALESCE(s.value,'[]'::jsonb)||$2::jsonb) WITH ORDINALITY AS x(val,ord) GROUP BY val
      ) unique_items
    ),updated_at=NOW() WHERE s.key='portfolio_service_categories' AND EXISTS(SELECT 1 FROM migration)
  `, [JSON.stringify(SERVICE_CATALOGUE),JSON.stringify(SERVICE_PORTFOLIO_CATEGORIES)]);
  await sql.query(`WITH migration AS (INSERT INTO site_settings(key,value) VALUES ('blog_starters_v1_applied','true'::jsonb) ON CONFLICT(key) DO NOTHING RETURNING key)
 INSERT INTO blog_posts(slug,title,description,category,service,body,source,status)
 SELECT x.slug,x.title,x.description,x.category,x.service,x.body,x.source,'draft' FROM jsonb_to_recordset($1::jsonb) AS x(slug text,title text,description text,category text,service text,body text,source text) CROSS JOIN migration ON CONFLICT(slug) DO NOTHING`,[JSON.stringify(BLOG_STARTERS)]);
  for (const item of DEFAULT_PORTFOLIO) {
    await sql.query(
      `INSERT INTO portfolio_projects (slug,title,category,excerpt,description,cover_image,gallery,project_url,featured,sort_order,status,published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,NOW()) ON CONFLICT (slug) DO NOTHING`,
      [item.slug,item.title,item.category,item.excerpt,item.description,item.cover_image,JSON.stringify(item.gallery),item.project_url,item.featured,item.sort_order,item.status]
    );
  }
  for (const item of DEFAULT_FAQS) {
    await sql.query(
      `INSERT INTO faqs (question,answer,sort_order,status)
       SELECT $1,$2,$3,$4 WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question=$1)`,
      [item.question,item.answer,item.sort_order,item.status]
    );
  }
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const statement of schema) {
        // Concurrent cold starts can try to create the same PostgreSQL type at once.
        // IF NOT EXISTS is not fully concurrency-safe at pg_type catalog level.
        for (let attempt = 0; ; attempt++) {
          try { await query(statement); break; }
          catch (error) {
            const concurrentCreate = error?.code === "23505" &&
              String(error?.message || "").includes("pg_type_typname_nsp_index");
            if (!concurrentCreate || attempt >= 4) throw error;
            await new Promise(resolve => setTimeout(resolve, 80 * (attempt + 1)));
          }
        }
      }
      await seed();
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function audit(userId, action, entityType, entityId = "", summary = "") {
  await query(
    "INSERT INTO audit_logs (user_id,action,entity_type,entity_id,summary) VALUES ($1,$2,$3,$4,$5)",
    [userId || null, action, entityType, String(entityId || ""), summary]
  );
}

export async function revision(userId, entityType, entityId, snapshot) {
  if (!snapshot) return;
  await query(
    "INSERT INTO content_revisions (user_id,entity_type,entity_id,snapshot) VALUES ($1,$2,$3,$4::jsonb)",
    [userId || null, entityType, String(entityId), JSON.stringify(snapshot)]
  );
}
