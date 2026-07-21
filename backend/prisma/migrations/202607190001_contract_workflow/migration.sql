BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS contract_audit_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT NOT NULL, owner_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'ingested', version INTEGER NOT NULL DEFAULT 1, source_manifest JSONB NOT NULL, toolchain_manifest JSONB NOT NULL,
  bytecode_hash TEXT NOT NULL, chain_context JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,idempotency_key), CHECK(stage IN ('ingested','compiled','bytecode_matched','analyzed','exploit_reproduced','reviewer_review','confirmed','remediated','regression_verified','closed'))
);
CREATE INDEX IF NOT EXISTS contract_audit_cases_tenant_stage_idx ON contract_audit_cases(tenant_id,stage,updated_at DESC);
CREATE TABLE IF NOT EXISTS contract_tool_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT NOT NULL, case_id UUID NOT NULL REFERENCES contract_audit_cases(id), tool_name TEXT NOT NULL,
  tool_version TEXT NOT NULL, image_digest TEXT NOT NULL, config_hash TEXT NOT NULL, status TEXT NOT NULL, started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ, artifact_uri TEXT, stderr_redacted TEXT, UNIQUE(tenant_id,case_id,tool_name,config_hash)
);
CREATE TABLE IF NOT EXISTS contract_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT NOT NULL, case_id UUID NOT NULL REFERENCES contract_audit_cases(id),
  severity TEXT NOT NULL, detector TEXT NOT NULL, title TEXT NOT NULL, source_location JSONB NOT NULL, execution_path JSONB,
  minimized_exploit TEXT, confidence NUMERIC NOT NULL, remediation TEXT NOT NULL, false_positive_disposition TEXT,
  regression_test_uri TEXT, status TEXT NOT NULL DEFAULT 'open', CHECK(confidence BETWEEN 0 AND 1)
);
CREATE TABLE IF NOT EXISTS contract_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT NOT NULL, corpus_version TEXT NOT NULL, toolchain_hash TEXT NOT NULL,
  recall NUMERIC NOT NULL, precision NUMERIC NOT NULL, deterministic BOOLEAN NOT NULL, high_findings_complete BOOLEAN NOT NULL,
  passed BOOLEAN NOT NULL, details JSONB NOT NULL DEFAULT '{}', evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS contract_workflow_audit (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, case_id UUID, actor_id TEXT NOT NULL, action TEXT NOT NULL,
  from_stage TEXT, to_stage TEXT, payload JSONB NOT NULL DEFAULT '{}', occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION contract_workflow_audit_immutable() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'contract workflow audit is append-only'; END; $$;
DROP TRIGGER IF EXISTS contract_workflow_audit_no_mutation ON contract_workflow_audit;
CREATE TRIGGER contract_workflow_audit_no_mutation BEFORE UPDATE OR DELETE ON contract_workflow_audit FOR EACH ROW EXECUTE FUNCTION contract_workflow_audit_immutable();
COMMIT;
