import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create initial super admin user
  const adminEmail = 'admin@megaboxsupply.com';
  const adminPassword = 'admin123'; // Temporary - should be changed after first login

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
  } else {
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        role: 'super_admin',
        twoFactorEnabled: false,
      },
    });

    console.log('Created super admin user:', admin.email);
    console.log('IMPORTANT: Change the password after first login!');
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

