const test=require('node:test');const assert=require('node:assert/strict');const p=require('../domain/contractPolicy.cjs');
const source={contract_ref:'c1',source_hash:'sha:s',compiler:'solc',compiler_version:'0.8.30',toolchain_digest:'sha:t',dependency_lock_hash:'sha:l',chain_id:'1',bytecode_hash:'sha:b',language:'solidity'};
test('validates deterministic pinned Solidity source',()=>assert.equal(p.validateSource(source).sandbox_required,true));
test('rejects unsupported unvalidated language',()=>assert.throws(()=>p.validateSource({...source,language:'move'}),/Solidity/));
test('high findings require minimized exploit and disposition',()=>assert.throws(()=>p.validateFinding({finding_ref:'f1',category:'reentrancy',severity:'high',affected_path:'A.sol:1',confidence:.9,remediation:'guard'}),/minimized/));
test('accepts complete exploit-backed finding',()=>assert.equal(p.validateFinding({finding_ref:'f1',category:'reentrancy',severity:'high',affected_path:'A.sol:1',confidence:.9,remediation:'guard',minimized_exploit_ref:'test:f1',false_positive_disposition:'confirmed'}).confidence,.9));
test('confirmation requires independent auditor',()=>assert.throws(()=>p.validateTransition('reviewer_review','confirmed',{role:'AUDITOR',actorId:'u1',createdBy:'u1',exploitEvidence:'x'}),/independent/));
test('regression and closure require evidence',()=>{assert.throws(()=>p.validateTransition('remediated','regression_verified',{}),/bytecode/);assert.throws(()=>p.validateTransition('regression_verified','closed',{}),/disposition/);});

