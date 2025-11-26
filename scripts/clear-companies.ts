import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearCompanies() {
  try {
    console.log("🧹 Clearing all companies and related data...");
    
    // First, delete all tickets (they reference companies)
    const deletedTickets = await prisma.ticket.deleteMany({});
    console.log(`✅ Deleted ${deletedTickets.count} tickets`);
    
    // Delete all invoices
    const deletedInvoices = await prisma.invoice.deleteMany({});
    console.log(`✅ Deleted ${deletedInvoices.count} invoices`);
    
    // Delete all users that belong to companies (keep admin users)
    // Skip this for now - we'll keep all users
    // const deletedUsers = await prisma.user.deleteMany({
    //   where: {
    //     companyId: { not: null },
    //   },
    // });
    // console.log(`✅ Deleted ${deletedUsers.count} customer users`);
    
    // Sites and machines will be cascade deleted when we delete companies
    const siteCount = await prisma.site.count();
    const machineCount = await prisma.machine.count();
    
    // Now delete all companies (this will cascade delete sites and machines)
    const deletedCompanies = await prisma.company.deleteMany({});
    console.log(`✅ Deleted ${deletedCompanies.count} companies`);
    console.log(`✅ Cascade deleted ${siteCount} sites and ${machineCount} machines`);
    
    console.log("\n🎉 All companies and related data cleared successfully!");
    console.log("You can now sync fresh data from HubSpot.");
  } catch (error) {
    console.error("❌ Error clearing companies:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearCompanies()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

