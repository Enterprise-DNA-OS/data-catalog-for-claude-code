CREATE TABLE assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source text NOT NULL CHECK(length(trim(source))>0), namespace text NOT NULL DEFAULT '',
 name text NOT NULL CHECK(length(trim(name))>0), kind text NOT NULL DEFAULT 'table' CHECK(kind IN ('table','view','report','file','dataset')),
 description text NOT NULL DEFAULT '', owner text NOT NULL DEFAULT '', classification text NOT NULL DEFAULT 'unknown' CHECK(classification IN ('unknown','public','internal','personal','sensitive')),
 purpose text NOT NULL DEFAULT '', retention_rule text NOT NULL DEFAULT '', security_evidence text NOT NULL DEFAULT '', review_due date,
 last_reviewed date, review_required boolean NOT NULL DEFAULT true, archived boolean NOT NULL DEFAULT false, source_row jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(source,namespace,name)
);
CREATE TABLE fields (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id uuid NOT NULL REFERENCES assets(id), name text NOT NULL CHECK(length(trim(name))>0),
 data_type text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', classification text NOT NULL DEFAULT 'unknown' CHECK(classification IN ('unknown','public','internal','personal','sensitive')),
 source_row jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(asset_id,name)
);
CREATE TABLE terms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE CHECK(length(trim(name))>0), definition text NOT NULL CHECK(length(trim(definition))>0),
 owner text NOT NULL CHECK(length(trim(owner))>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE term_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), term_id uuid NOT NULL REFERENCES terms(id), asset_id uuid NOT NULL REFERENCES assets(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(term_id,asset_id)
);
CREATE TABLE lineage (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), upstream_id uuid NOT NULL REFERENCES assets(id), downstream_id uuid NOT NULL REFERENCES assets(id),
 evidence text NOT NULL CHECK(length(trim(evidence))>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(upstream_id,downstream_id), CHECK(upstream_id<>downstream_id)
);
CREATE TABLE reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id uuid NOT NULL REFERENCES assets(id), actor text NOT NULL, evidence text NOT NULL,
 reviewed_on date NOT NULL DEFAULT current_date, next_due date NOT NULL, snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE issues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id uuid NOT NULL REFERENCES assets(id), title text NOT NULL CHECK(length(trim(title))>0),
 owner text NOT NULL, severity text NOT NULL CHECK(severity IN ('low','medium','high')), due date NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')), resolution text, resolved_on date,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE quality_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id uuid NOT NULL REFERENCES assets(id), rule text NOT NULL, checked_on date NOT NULL,
 examined integer NOT NULL CHECK(examined>0), failed integer NOT NULL CHECK(failed>=0 AND failed<=examined), evidence text NOT NULL, actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity text NOT NULL, entity_id uuid NOT NULL, action text NOT NULL, actor text NOT NULL,
 before_row jsonb, after_row jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION touch_updated() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE FUNCTION immutable_record() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'This evidence record is append-only'; END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['assets','fields','terms','term_links','lineage','issues'] LOOP
 EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['reviews','quality_runs','audit'] LOOP
 EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION immutable_record()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['assets','fields','terms','term_links','lineage','reviews','issues','quality_runs','audit'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
 END LOOP;
END $$;
CREATE VIEW catalog_register AS
 SELECT a.id,a.source,a.namespace,a.name,a.kind,a.owner,a.classification,a.review_due,a.review_required,a.archived,
 (SELECT count(*)::int FROM fields f WHERE f.asset_id=a.id) AS field_count,
 (SELECT count(*)::int FROM fields f WHERE f.asset_id=a.id AND f.description='') AS undefined_fields,
 (SELECT count(*)::int FROM issues i WHERE i.asset_id=a.id AND i.status='open') AS open_issues
 FROM assets a;
CREATE VIEW review_queue AS
 SELECT id,source,name,owner,review_due,review_required,open_issues,
 CASE WHEN owner='' THEN 'assign owner' WHEN review_required THEN 'review changed records' WHEN review_due IS NULL THEN 'set review date' ELSE 'review overdue' END AS next_action
 FROM catalog_register WHERE NOT archived AND (owner='' OR review_required OR review_due IS NULL OR review_due<current_date);
CREATE VIEW quality_latest AS
 SELECT DISTINCT ON(q.asset_id,q.rule) q.id,q.asset_id,a.name,q.rule,q.checked_on,q.examined,q.failed,
 round(100.0*q.failed/q.examined,2) AS failed_percent,q.evidence
 FROM quality_runs q JOIN assets a ON a.id=q.asset_id WHERE NOT a.archived
 ORDER BY q.asset_id,q.rule,q.checked_on DESC,q.created_at DESC,q.id DESC;
CREATE VIEW compliance_checks AS
 SELECT a.id,a.name,'GOV01'::text AS rule,'Owner or classification missing'::text AS finding FROM assets a WHERE NOT archived AND (owner='' OR classification='unknown')
 UNION ALL SELECT a.id,a.name,'NZ08','Accuracy review missing, changed or overdue' FROM assets a WHERE NOT archived AND
 (a.classification IN ('personal','sensitive') OR EXISTS(SELECT 1 FROM fields f WHERE f.asset_id=a.id AND f.classification IN ('personal','sensitive'))) AND (last_reviewed IS NULL OR review_required OR review_due IS NULL OR review_due<current_date)
 UNION ALL SELECT a.id,a.name,'NZ09','Purpose or retention rationale missing' FROM assets a WHERE NOT archived AND
 (a.classification IN ('personal','sensitive') OR EXISTS(SELECT 1 FROM fields f WHERE f.asset_id=a.id AND f.classification IN ('personal','sensitive'))) AND (purpose='' OR retention_rule='')
 UNION ALL SELECT a.id,a.name,'GOV02','Security review evidence missing' FROM assets a WHERE NOT archived AND
 (a.classification IN ('personal','sensitive') OR EXISTS(SELECT 1 FROM fields f WHERE f.asset_id=a.id AND f.classification IN ('personal','sensitive'))) AND security_evidence='';
CREATE VIEW owner_workload AS
 SELECT coalesce(nullif(a.owner,''),'Unassigned') AS owner,count(*)::int AS assets,
 count(*) FILTER(WHERE a.review_required OR a.review_due IS NULL OR a.review_due<current_date)::int AS reviews_due,
 sum(a.open_issues)::int AS open_issues,sum(a.undefined_fields)::int AS undefined_fields FROM catalog_register a WHERE NOT archived GROUP BY a.owner;
