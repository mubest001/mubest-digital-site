-- Mubest Digital Studio 4.0 visual editor storage.
-- The visual-layout API also creates this table automatically on first request.
CREATE TABLE IF NOT EXISTS visual_page_layouts (
  slug TEXT PRIMARY KEY CHECK (slug IN ('home','about','services','portfolio','contact')),
  draft JSONB NOT NULL DEFAULT '{"version":1,"patches":[],"added":[],"moves":[]}'::jsonb,
  published JSONB NOT NULL DEFAULT '{"version":1,"patches":[],"added":[],"moves":[]}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
