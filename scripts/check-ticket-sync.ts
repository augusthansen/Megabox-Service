/**
 * Quick script to check if a ticket has been synced to HubSpot
 * 
 * Usage: npx tsx scripts/check-ticket-sync.ts [ticket-number]
 */

import { prisma } from "../lib/prisma";

async function checkTicketSync() {
  const ticketNumber = process.argv[2];

  if (!ticketNumber) {
    console.log("Usage: npx tsx scripts/check-ticket-sync.ts [ticket-number]");
    console.log("Example: npx tsx scripts/check-ticket-sync.ts TKT-20241201-1234");
    process.exit(1);
  }

  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: ticketNumber,
      },
      include: {
        company: {
          select: {
            name: true,
            hubspotId: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
            hubspotId: true,
          },
        },
      },
    });

    if (!ticket) {
      console.log(`❌ Ticket ${ticketNumber} not found in database`);
      process.exit(1);
    }

    console.log("\n📋 Ticket Information:");
    console.log(`   Ticket Number: ${ticket.ticketNumber}`);
    console.log(`   Subject: ${ticket.subject}`);
    console.log(`   HubSpot ID: ${ticket.hubspotId || "❌ NOT SYNCED"}`);
    
    if (ticket.hubspotId) {
      console.log(`   ✅ HubSpot URL: https://app.hubspot.com/contacts/ticket/${ticket.hubspotId}`);
    }

    console.log("\n🏢 Company Information:");
    console.log(`   Name: ${ticket.company.name}`);
    console.log(`   HubSpot ID: ${ticket.company.hubspotId || "❌ NOT IN HUBSPOT"}`);
    
    if (ticket.company.hubspotId) {
      console.log(`   ✅ HubSpot URL: https://app.hubspot.com/contacts/companies/${ticket.company.hubspotId}`);
    }

    console.log("\n👤 Created By:");
    console.log(`   Name: ${ticket.createdBy.name}`);
    console.log(`   Email: ${ticket.createdBy.email}`);
    console.log(`   HubSpot ID: ${ticket.createdBy.hubspotId || "❌ NOT IN HUBSPOT"}`);

    if (!ticket.hubspotId) {
      console.log("\n⚠️  This ticket has not been synced to HubSpot yet.");
      console.log("   Run the 'Sync to HubSpot' button in the admin panel.");
    } else {
      console.log("\n✅ Ticket is synced to HubSpot!");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTicketSync();

