import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
// This CommonJS policy is deliberately dependency-free and shared with node:test.
const policy = require('../../domain/contractPolicy.cjs');

const router = Router();
router.use(authenticate);
const tenantOf = (req: AuthRequest) => String(req.user?.organizationId || req.userId);

router.post('/cases', async (req: AuthRequest, res: Response) => {
  try {
    const source = policy.validateSource(req.body.source || {});
    if (!req.body.idempotency_key) throw new Error('idempotency_key is required');
    const tenant = tenantOf(req);
    const rows: any[] = await prisma.$queryRawUnsafe(
      `INSERT INTO contract_audit_cases(tenant_id,owner_id,idempotency_key,source_manifest,toolchain_manifest,bytecode_hash,chain_context)
       VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7::jsonb)
       ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
      tenant, String(req.userId), req.body.idempotency_key, JSON.stringify(source), JSON.stringify({ compiler:source.compiler, version:source.compiler_version, digest:source.toolchain_digest, dependency_lock_hash:source.dependency_lock_hash }), source.bytecode_hash, JSON.stringify({ chain_id:source.chain_id })
    );
    res.status(201).json(rows[0]);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post('/cases/:id/findings', async (req: AuthRequest, res: Response) => {
  try {
    const tenant=tenantOf(req); const finding=policy.validateFinding(req.body);
    const owned:any[]=await prisma.$queryRawUnsafe('SELECT id FROM contract_audit_cases WHERE id=$1::uuid AND tenant_id=$2',req.params.id,tenant);
    if(!owned[0]) return res.status(404).json({error:'Audit case not found'});
    const rows:any[]=await prisma.$queryRawUnsafe(`INSERT INTO contract_findings(tenant_id,case_id,severity,detector,title,source_location,execution_path,minimized_exploit,confidence,remediation,false_positive_disposition,regression_test_uri)
      VALUES($1,$2::uuid,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12) RETURNING *`,tenant,req.params.id,finding.severity,finding.category,finding.finding_ref,JSON.stringify(finding.source_location||{}),JSON.stringify(finding.affected_path),finding.minimized_exploit_ref||null,finding.confidence,finding.remediation,finding.false_positive_disposition||null,finding.regression_test_uri||null);
    res.status(201).json(rows[0]);
  } catch(error:any){res.status(400).json({error:error.message});}
});

router.post('/cases/:id/tool-runs', async (req: AuthRequest, res: Response) => {
  try {
    const allowed=new Set(['static','fuzz','invariant','symbolic','protocol']);
    if(!allowed.has(req.body.tool_name)||!req.body.tool_version||!/^sha256:[a-f0-9]{64}$/i.test(req.body.image_digest||'')||!req.body.config_hash) throw new Error('pinned supported tool manifest is required');
    const tenant=tenantOf(req); const owned:any[]=await prisma.$queryRawUnsafe('SELECT id FROM contract_audit_cases WHERE id=$1::uuid AND tenant_id=$2',req.params.id,tenant);if(!owned[0])return res.status(404).json({error:'Audit case not found'});
    const rows:any[]=await prisma.$queryRawUnsafe(`INSERT INTO contract_tool_runs(tenant_id,case_id,tool_name,tool_version,image_digest,config_hash,status,started_at,artifact_uri,stderr_redacted)
      VALUES($1,$2::uuid,$3,$4,$5,$6,$7,NOW(),$8,$9) ON CONFLICT(tenant_id,case_id,tool_name,config_hash) DO UPDATE SET status=EXCLUDED.status RETURNING *`,tenant,req.params.id,req.body.tool_name,req.body.tool_version,req.body.image_digest,req.body.config_hash,req.body.status||'queued',req.body.artifact_uri||null,req.body.stderr_redacted||null);
    res.status(202).json(rows[0]);
  } catch(error:any){res.status(400).json({error:error.message});}
});

router.post('/cases/:id/transition', async (req: AuthRequest, res: Response) => {
  try {
    const tenant=tenantOf(req);
    const result:any=await prisma.$transaction(async(tx:any)=>{
      const rows:any[]=await tx.$queryRawUnsafe('SELECT * FROM contract_audit_cases WHERE id=$1::uuid AND tenant_id=$2 FOR UPDATE',req.params.id,tenant);const current=rows[0];if(!current)throw Object.assign(new Error('Audit case not found'),{status:404});if(Number(req.body.version)!==current.version)throw Object.assign(new Error('Stale workflow version'),{status:409});
      policy.validateTransition(current.stage,req.body.to_stage,{...req.body.context,role:req.user?.role,actorId:String(req.userId),createdBy:current.owner_id});
      const updated:any[]=await tx.$queryRawUnsafe('UPDATE contract_audit_cases SET stage=$1,version=version+1,updated_at=NOW() WHERE id=$2::uuid RETURNING *',req.body.to_stage,current.id);
      await tx.$executeRawUnsafe('INSERT INTO contract_workflow_audit(tenant_id,case_id,actor_id,action,from_stage,to_stage,payload) VALUES($1,$2::uuid,$3,$4,$5,$6,$7::jsonb)',tenant,current.id,String(req.userId),'audit.transitioned',current.stage,req.body.to_stage,JSON.stringify(req.body.context||{}));return updated[0];
    });res.json(result);
  } catch(error:any){res.status(error.status||400).json({error:error.message});}
});
export default router;
