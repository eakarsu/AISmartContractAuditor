import { Router } from 'express';

const router = Router();

const dependencies = [
  { id: 1, contract: 'VaultRouter', oracle: 'Chainlink ETH/USD', heartbeatMinutes: 60, deviationBps: 50, risk: 'medium' },
  { id: 2, contract: 'LendingPool', oracle: 'Custom TWAP', heartbeatMinutes: 240, deviationBps: 125, risk: 'high' },
  { id: 3, contract: 'RewardsMinter', oracle: 'Chainlink LINK/USD', heartbeatMinutes: 30, deviationBps: 25, risk: 'low' },
];

router.get('/', (_req, res) => {
  res.json({
    summary: {
      dependencies: dependencies.length,
      highRisk: dependencies.filter((item) => item.risk === 'high').length,
      staleHeartbeat: dependencies.filter((item) => item.heartbeatMinutes > 120).length,
    },
    dependencies,
  });
});

router.post('/mitigation', (req, res) => {
  const item = dependencies.find((entry) => entry.id === Number(req.body?.id)) || dependencies[0];
  res.json({
    contract: item.contract,
    mitigation: item.risk === 'high' ? 'Add circuit breaker, fallback oracle, and max staleness guard.' : 'Document oracle assumptions and monitor deviation thresholds.',
    tests: ['stale price rejection', 'deviation threshold breach', 'fallback oracle activation'],
  });
});

export default router;
