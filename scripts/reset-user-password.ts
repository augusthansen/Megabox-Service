import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

/**
 * Reset a user's password
 * Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>
 */

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("❌ Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>");
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);

    // Hash the new password
    console.log(`\n🔐 Hashing new password...`);
    const passwordHash = await hashPassword(newPassword);

    // Update the user
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log(`\n✅ Password reset successfully!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n💡 You can now log in with these credentials.`);
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();

