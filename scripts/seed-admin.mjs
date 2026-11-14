import bcrypt from "bcryptjs";
import { PrismaClient } from "../services/auth-service/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:malay21@localhost:5432/hotel_auth_db?schema=public",
    },
  },
});

async function main() {
  const email = "mala@gmail.com";
  const password = "123456";
  const name = "Mala Admin";
  const phone = "+91 9876543210";
  const role = "ADMIN";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      isActive: true,
      name,
    },
    create: {
      email,
      passwordHash,
      name,
      phone,
      role,
      isActive: true,
    },
  });

  console.log(`✅ Admin user seeded successfully:`, {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
}

main()
  .catch((err) => {
    console.error("❌ Failed to seed admin user:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
