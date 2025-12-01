import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Database Seed Script
 *
 * Creates demo data for development and testing.
 * Run with: npx prisma db seed
 */

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== "production") {
    console.log("Clearing existing data...");
    await prisma.comment.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.session.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.machineAlarm.deleteMany();
    await prisma.machine.deleteMany();
    await prisma.floorMap.deleteMany();
    await prisma.site.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  }

  // Create password hash for demo users
  const passwordHash = await bcrypt.hash("demo123!", 10);

  // ============================================
  // Create Companies
  // ============================================
  console.log("Creating companies...");

  const megaboxSupply = await prisma.company.create({
    data: {
      name: "Megabox Supply Co",
      pricingTier: "mega",
      pricePerMachine: 0,
      hourlyRate: 0,
    },
  });

  const acmeCorp = await prisma.company.create({
    data: {
      name: "Acme Corporation",
      hubspotId: "12345678",
      pricingTier: "standard",
      pricePerMachine: 50,
      hourlyRate: 180,
    },
  });

  const globalLogistics = await prisma.company.create({
    data: {
      name: "Global Logistics Inc",
      hubspotId: "87654321",
      pricingTier: "mega",
      pricePerMachine: 35,
      hourlyRate: 150,
    },
  });

  const techStartup = await prisma.company.create({
    data: {
      name: "Tech Startup LLC",
      pricingTier: "basic",
      pricePerMachine: 40,
      hourlyRate: 180,
    },
  });

  // ============================================
  // Create Users
  // ============================================
  console.log("Creating users...");

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@megaboxsupply.com",
      passwordHash,
      name: "System Admin",
      role: "super_admin",
      companyId: megaboxSupply.id,
    },
  });

  const serviceTech1 = await prisma.user.create({
    data: {
      email: "tech1@megaboxsupply.com",
      passwordHash,
      name: "John Smith",
      role: "service_tech",
      companyId: megaboxSupply.id,
    },
  });

  const serviceTech2 = await prisma.user.create({
    data: {
      email: "tech2@megaboxsupply.com",
      passwordHash,
      name: "Sarah Johnson",
      role: "service_tech",
      companyId: megaboxSupply.id,
    },
  });

  const acmeAdmin = await prisma.user.create({
    data: {
      email: "admin@acme.com",
      passwordHash,
      name: "Bob Wilson",
      role: "customer_admin",
      companyId: acmeCorp.id,
    },
  });

  const acmeTech = await prisma.user.create({
    data: {
      email: "tech@acme.com",
      passwordHash,
      name: "Alice Brown",
      role: "customer_tech",
      companyId: acmeCorp.id,
    },
  });

  const globalAdmin = await prisma.user.create({
    data: {
      email: "admin@globallogistics.com",
      passwordHash,
      name: "Mike Davis",
      role: "customer_admin",
      companyId: globalLogistics.id,
    },
  });

  // ============================================
  // Create Sites
  // ============================================
  console.log("Creating sites...");

  const acmeHQ = await prisma.site.create({
    data: {
      companyId: acmeCorp.id,
      name: "Acme Headquarters",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      timezone: "America/New_York",
      contactName: "Bob Wilson",
      contactPhone: "555-123-4567",
      contactEmail: "bob@acme.com",
    },
  });

  const acmeWarehouse = await prisma.site.create({
    data: {
      companyId: acmeCorp.id,
      name: "Acme Distribution Center",
      address: "456 Industrial Blvd",
      city: "Newark",
      state: "NJ",
      zipCode: "07102",
      timezone: "America/New_York",
      contactName: "Jane Doe",
      contactPhone: "555-987-6543",
      contactEmail: "jane@acme.com",
    },
  });

  const globalDC1 = await prisma.site.create({
    data: {
      companyId: globalLogistics.id,
      name: "Chicago Fulfillment Center",
      address: "789 Logistics Way",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      timezone: "America/Chicago",
      contactName: "Mike Davis",
      contactPhone: "555-456-7890",
      contactEmail: "mike@globallogistics.com",
    },
  });

  const globalDC2 = await prisma.site.create({
    data: {
      companyId: globalLogistics.id,
      name: "LA Distribution Hub",
      address: "321 Pacific Drive",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      timezone: "America/Los_Angeles",
      contactName: "Lisa Chen",
      contactPhone: "555-789-0123",
      contactEmail: "lisa@globallogistics.com",
    },
  });

  const techOffice = await prisma.site.create({
    data: {
      companyId: techStartup.id,
      name: "Tech Startup Office",
      address: "555 Innovation Lane",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      timezone: "America/Los_Angeles",
      contactName: "Alex Kim",
      contactPhone: "555-321-9876",
      contactEmail: "alex@techstartup.com",
    },
  });

  // ============================================
  // Create Machines
  // ============================================
  console.log("Creating machines...");

  const machines = await Promise.all([
    // Acme HQ machines
    prisma.machine.create({
      data: {
        siteId: acmeHQ.id,
        name: "Inserter-01",
        model: "FP Mailing Folder Inserter",
        series: "SI-76",
        serialNumber: "SI76-2024-001",
        windowsVersion: "Windows 10 Pro",
        directConnectVersion: "3.2.1",
        firmwareVersion: "2.4.0",
        status: "operational",
        hasRemoteAccess: true,
        remoteAccessType: "TeamViewer",
        remoteAccessId: "123456789",
        configuration: {
          feeders: 6,
          stations: 4,
          scanning: true,
          maxSpeed: 4500,
        },
      },
    }),
    prisma.machine.create({
      data: {
        siteId: acmeHQ.id,
        name: "Inserter-02",
        model: "FP Mailing Folder Inserter",
        series: "SI-62",
        serialNumber: "SI62-2023-015",
        windowsVersion: "Windows 10 Pro",
        directConnectVersion: "3.1.5",
        firmwareVersion: "2.3.1",
        status: "operational",
        hasRemoteAccess: true,
        remoteAccessType: "AnyDesk",
        remoteAccessId: "987654321",
      },
    }),
    // Acme Warehouse machine
    prisma.machine.create({
      data: {
        siteId: acmeWarehouse.id,
        name: "Mail-Processor-01",
        model: "FP Mailing Folder Inserter",
        series: "SI-92",
        serialNumber: "SI92-2024-003",
        status: "operational",
        hasRemoteAccess: false,
      },
    }),
    // Global Logistics machines
    prisma.machine.create({
      data: {
        siteId: globalDC1.id,
        name: "Chicago-Inserter-01",
        model: "FP Mailing Folder Inserter",
        series: "SI-76",
        serialNumber: "SI76-2023-042",
        status: "operational",
        hasRemoteAccess: true,
        remoteAccessType: "TeamViewer",
        isCurrentlyDown: false,
      },
    }),
    prisma.machine.create({
      data: {
        siteId: globalDC1.id,
        name: "Chicago-Inserter-02",
        model: "FP Mailing Folder Inserter",
        series: "SI-62",
        serialNumber: "SI62-2024-007",
        status: "maintenance",
        isCurrentlyDown: true,
        hasRemoteAccess: true,
        remoteAccessType: "TeamViewer",
      },
    }),
    prisma.machine.create({
      data: {
        siteId: globalDC2.id,
        name: "LA-Inserter-01",
        model: "FP Mailing Folder Inserter",
        series: "SI-92",
        serialNumber: "SI92-2024-011",
        status: "operational",
        hasRemoteAccess: true,
        remoteAccessType: "AnyDesk",
      },
    }),
    // Tech Startup machine
    prisma.machine.create({
      data: {
        siteId: techOffice.id,
        name: "Startup-Mailer-01",
        model: "FP Mailing Folder Inserter",
        series: "SI-32",
        serialNumber: "SI32-2024-022",
        status: "operational",
        hasRemoteAccess: false,
      },
    }),
  ]);

  // ============================================
  // Create Tickets
  // ============================================
  console.log("Creating tickets...");

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-20241201-0001",
      companyId: acmeCorp.id,
      siteId: acmeHQ.id,
      machineId: machines[0].id,
      createdById: acmeTech.id,
      assignedToId: serviceTech1.id,
      subject: "Paper jam error on Inserter-01",
      description:
        "Machine is showing E102 error code. Paper appears to be jamming at station 3. Tried clearing but error persists.",
      priority: "high",
      status: "in_progress",
      machineDown: true,
      createdAt: yesterday,
      assignedAt: yesterday,
      startedAt: now,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-20241201-0002",
      companyId: globalLogistics.id,
      siteId: globalDC1.id,
      machineId: machines[4].id,
      createdById: globalAdmin.id,
      assignedToId: serviceTech2.id,
      subject: "Scheduled maintenance - Chicago-Inserter-02",
      description:
        "Quarterly preventive maintenance. Machine has been running slow, needs inspection.",
      priority: "medium",
      status: "assigned",
      machineDown: true,
      createdAt: twoDaysAgo,
      assignedAt: yesterday,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-20241130-0001",
      companyId: acmeCorp.id,
      siteId: acmeWarehouse.id,
      createdById: acmeAdmin.id,
      subject: "Request for remote access setup",
      description:
        "Need to set up remote access on Mail-Processor-01 for faster support.",
      priority: "low",
      status: "open",
      createdAt: lastWeek,
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-20241125-0001",
      companyId: globalLogistics.id,
      siteId: globalDC2.id,
      machineId: machines[5].id,
      createdById: globalAdmin.id,
      assignedToId: serviceTech1.id,
      subject: "Firmware update required",
      description:
        "LA-Inserter-01 needs firmware update to version 2.5.0 for new features.",
      priority: "low",
      status: "resolved",
      createdAt: lastWeek,
      assignedAt: lastWeek,
      resolvedAt: twoDaysAgo,
    },
  });

  // ============================================
  // Create Sessions (time tracking)
  // ============================================
  console.log("Creating sessions...");

  await prisma.session.create({
    data: {
      ticketId: ticket1.id,
      techId: serviceTech1.id,
      sessionType: "remote_support",
      startTime: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
      endTime: now,
      durationMinutes: 45,
      rateType: "business",
      rateAmount: 180,
      rateMultiplier: 1,
      cost: 135, // 45 mins at $180/hr
      notes: "Diagnosed paper jam issue. Cleared jam at station 3. Monitoring.",
    },
  });

  await prisma.session.create({
    data: {
      ticketId: ticket4.id,
      techId: serviceTech1.id,
      sessionType: "remote_support",
      startTime: new Date(twoDaysAgo.getTime() - 30 * 60 * 1000),
      endTime: twoDaysAgo,
      durationMinutes: 30,
      rateType: "business",
      rateAmount: 150,
      rateMultiplier: 1,
      cost: 75,
      notes: "Completed firmware update to v2.5.0. All systems operational.",
    },
  });

  // ============================================
  // Create Comments
  // ============================================
  console.log("Creating comments...");

  await prisma.comment.createMany({
    data: [
      {
        ticketId: ticket1.id,
        authorId: acmeTech.id,
        authorName: "Alice Brown",
        content: "Machine started showing this error around 2pm today.",
        isInternal: false,
        createdAt: yesterday,
      },
      {
        ticketId: ticket1.id,
        authorId: serviceTech1.id,
        authorName: "John Smith",
        content:
          "Looking into this now. E102 typically indicates a sensor issue at the specified station.",
        isInternal: false,
        createdAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket1.id,
        authorId: serviceTech1.id,
        authorName: "John Smith",
        content:
          "Internal note: Customer might need sensor replacement if this persists. Check parts inventory.",
        isInternal: true,
        createdAt: now,
      },
    ],
  });

  // ============================================
  // Create Machine Alarms
  // ============================================
  console.log("Creating machine alarms...");

  await prisma.machineAlarm.createMany({
    data: [
      {
        machineId: machines[0].id,
        alarmCode: "E102",
        alarmDescription: "Paper jam detected at station 3",
        occurrenceDate: yesterday,
      },
      {
        machineId: machines[4].id,
        alarmCode: "W001",
        alarmDescription: "Preventive maintenance due",
        occurrenceDate: twoDaysAgo,
      },
      {
        machineId: machines[0].id,
        alarmCode: "E101",
        alarmDescription: "Paper jam at feeder 2",
        occurrenceDate: lastWeek,
        resolvedDate: lastWeek,
        resolution: "Cleared manually",
      },
    ],
  });

  // ============================================
  // Summary
  // ============================================
  console.log("\n✅ Seed completed successfully!\n");
  console.log("Created:");
  console.log(`  - ${4} companies`);
  console.log(`  - ${6} users`);
  console.log(`  - ${5} sites`);
  console.log(`  - ${machines.length} machines`);
  console.log(`  - ${4} tickets`);
  console.log(`  - ${2} sessions`);
  console.log(`  - ${3} comments`);
  console.log(`  - ${3} machine alarms`);
  console.log("\n📧 Demo login credentials:");
  console.log("  Super Admin: admin@megaboxsupply.com / demo123!");
  console.log("  Service Tech: tech1@megaboxsupply.com / demo123!");
  console.log("  Customer Admin: admin@acme.com / demo123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
