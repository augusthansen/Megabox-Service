import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful!");
    console.log("Result:", result);
    
    // Try to count companies
    const companyCount = await prisma.company.count();
    console.log(`✅ Found ${companyCount} companies in database`);
    
  } catch (error: any) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check if your Supabase database is active (not paused)");
    console.error("2. Verify your DATABASE_URL in .env.local");
    console.error("3. Check Supabase dashboard for IP restrictions");
    console.error("4. Try using the direct connection string instead of pooler");
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

