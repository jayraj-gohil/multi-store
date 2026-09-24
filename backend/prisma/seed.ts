import { hashPassword } from '../src/common/utils/password.js';
import { prisma } from '../src/config/database.js';

// Demo-only credentials for local testing — not a real secret.
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin@12345';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await prisma.user.create({
    data: { name: 'Admin', email: ADMIN_EMAIL, passwordHash, role: 'ADMIN' },
  });
  console.log(`Created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
