const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('runtime admin credentials are required');
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(), password: hash,
      firstName: process.env.PROVISION_ADMIN_NAME || 'Runtime', lastName: 'Admin', role: 'ADMIN',
    },
    update: {
      password: hash, firstName: process.env.PROVISION_ADMIN_NAME || 'Runtime', lastName: 'Admin', role: 'ADMIN',
    },
  });
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS runtime_contract_ai_results (
      id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL,
      feature TEXT NOT NULL, input JSONB NOT NULL, output JSONB NOT NULL,
      model TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error('Runtime bootstrap failed:', error.message);
  await prisma.$disconnect();
  process.exit(1);
});
