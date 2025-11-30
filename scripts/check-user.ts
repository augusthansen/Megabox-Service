import { prisma } from "../lib/prisma";

/**
 * Check if a user exists and their details
 * Usage: npx tsx scripts/check-user.ts <email>
 */

async function checkUser() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: npx tsx scripts/check-user.ts <email>");
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    console.log(`   (Searching with lowercase: ${email.toLowerCase().trim()})`);

    // Try exact match first
    let user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    // If not found, try lowercase
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
    }

    // If still not found, try case-insensitive search
    if (!user) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: email,
            mode: "insensitive",
          },
        },
      });
      if (users.length > 0) {
        user = users[0];
        console.log(`⚠️  Found user with different case: ${user.email}`);
      }
    }

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log(`\n💡 Try checking the Users page in the admin panel to see all users.`);
      process.exit(1);
    }

    console.log(`\n✅ Found user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Company ID: ${user.companyId || "None"}`);
    console.log(`   Has Password Hash: ${user.passwordHash ? "Yes" : "No"}`);
    console.log(`   Password Hash Length: ${user.passwordHash?.length || 0} characters`);

    if (!user.isActive) {
      console.log(`\n⚠️  WARNING: User is inactive! This will prevent login.`);
    }

    if (!user.passwordHash || user.passwordHash.length < 10) {
      console.log(`\n⚠️  WARNING: Password hash appears invalid!`);
    }

  } catch (error: any) {
    console.error("❌ Error checking user:", error);
    if (error.message?.includes("Can't reach database")) {
      console.error("\n💡 Database connection issue. Make sure:");
      console.error("   1. Your .env file has DATABASE_URL set");
      console.error("   2. Your database is accessible");
      console.error("   3. Your dev server is running (it loads env vars)");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();

