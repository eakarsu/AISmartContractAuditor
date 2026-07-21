# Operations

Provision least-privilege PostgreSQL, copy `.env.example`, replace credentials and set a random 32+ character JWT secret. Install locked dependencies deliberately and apply `./scripts/migrate.sh`; `./start.sh` never installs, seeds, creates databases, accepts data loss, kills ports or changes schema.

Execute analyzers only in an external sandbox with pinned image digests, resource/network limits and secret redaction. Monitor failed tool runs, non-deterministic evaluations and high findings without exploit/false-positive disposition. A separate auditor confirms findings and regression evidence before close. Do not treat this software as proof of contract safety; generated AI/gap routes are quarantined.
