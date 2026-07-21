# Completeness review mapping

| Review requirement | Implementation |
|---|---|
| 1 | `contractWorkflow` accepts only pinned Solidity sources with compiler/toolchain/dependency hashes, bytecode hash and chain context, persisted reproducibly. |
| 2 | Tool-run storage represents pinned static, fuzz, invariant, symbolic and protocol detector executions in digest-addressed sandboxes with redacted stderr. |
| 3 | Findings persist affected path, confidence, remediation, false-positive disposition and require minimized exploit evidence for high/critical severity. |
| 4 | Versioned evaluation corpora record precision/recall/determinism and regression evidence; lifecycle gates require independent auditor confirmation and fixed-bytecode regression. |
| 5 | Strong auth, source redaction boundaries, digest pinning, append-only audit, policy tests, CI and explicit nondestructive migrations/startup provide a deterministic delivery baseline. |
