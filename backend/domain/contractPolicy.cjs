const STAGES = Object.freeze(['ingested','compiled','bytecode_matched','analyzed','exploit_reproduced','reviewer_review','confirmed','remediated','regression_verified','closed']);

function validateSource(input) {
  for (const field of ['contract_ref','source_hash','compiler','compiler_version','toolchain_digest','dependency_lock_hash','chain_id','bytecode_hash']) if (!input[field]) throw new Error(`${field} is required`);
  if (!['solidity'].includes(String(input.language || 'solidity').toLowerCase())) throw new Error('only validated Solidity workflow is supported');
  return { ...input, deterministic: true, sandbox_required: true };
}

function validateFinding(input) {
  for (const field of ['finding_ref','category','severity','affected_path','confidence','remediation']) if (input[field] === undefined || input[field] === null || input[field] === '') throw new Error(`${field} is required`);
  const confidence = Number(input.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error('confidence must be 0..1');
  if (['high','critical'].includes(String(input.severity).toLowerCase()) && (!input.minimized_exploit_ref || !input.false_positive_disposition)) throw new Error('high severity requires minimized exploit and disposition');
  return { ...input, confidence };
}

function validateTransition(from, to, context = {}) {
  const allowed = { ingested:['compiled'], compiled:['bytecode_matched','ingested'], bytecode_matched:['analyzed'], analyzed:['exploit_reproduced','reviewer_review'], exploit_reproduced:['reviewer_review'], reviewer_review:['analyzed','confirmed'], confirmed:['remediated'], remediated:['regression_verified'], regression_verified:['closed','confirmed'], closed:[] };
  if (!allowed[from]?.includes(to)) throw new Error('invalid contract audit transition');
  if (to === 'confirmed' && (!['AUDITOR','ADMIN'].includes(context.role) || !context.exploitEvidence || context.actorId === context.createdBy)) throw new Error('independent exploit-backed auditor confirmation required');
  if (to === 'regression_verified' && (!context.fixedBytecodeHash || !context.regressionCorpusVersion)) throw new Error('fixed bytecode and regression corpus required');
  if (to === 'closed' && !context.reviewerDisposition) throw new Error('reviewer disposition required');
  return true;
}

module.exports = { STAGES, validateSource, validateFinding, validateTransition };

