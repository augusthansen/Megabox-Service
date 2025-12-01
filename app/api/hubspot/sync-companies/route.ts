import { NextResponse } from "next/server";
import { syncCompaniesFromHubspot } from "@/lib/hubspot";
import { prisma } from "@/lib/prisma";

/**
 * HubSpot Sync Companies API
 * 
 * Syncs companies from HubSpot CRM into our database
 */

export async function POST() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    // Check if HubSpot API key is configured
    if (!process.env.HUBSPOT_API_KEY) {
      return NextResponse.json(
        { error: "HubSpot API key is not configured. Please set HUBSPOT_API_KEY in your environment variables." },
        { status: 400 }
      );
    }

    // Fetch companies from HubSpot
    const hubspotCompanies = await syncCompaniesFromHubspot();

    const synced = [];
    const updated = [];
    const errors = [];

    // Sync each company
    for (const hubspotCompany of hubspotCompanies) {
      try {
        // Check if company already exists by hubspotId
        const existing = await prisma.company.findUnique({
          where: { hubspotId: hubspotCompany.hubspotId },
        });

        if (existing) {
          // Update existing company
          await prisma.company.update({
            where: { id: existing.id },
            data: {
              name: hubspotCompany.name,
            },
          });
          updated.push(hubspotCompany.name);
        } else {
          // Create new company
          // Try to extract pricing tier from HubSpot properties if available
          const rawPricingTier = (hubspotCompany.properties.pricing_tier ||
                            hubspotCompany.properties.pricing_tier_c ||
                            "basic") as string;
          const pricingTier = rawPricingTier.toLowerCase();

          await prisma.company.create({
            data: {
              hubspotId: hubspotCompany.hubspotId,
              name: hubspotCompany.name,
              pricingTier: pricingTier === "standard" ? "standard" :
                          pricingTier === "mega" ? "mega" : "basic",
            },
          });
          synced.push(hubspotCompany.name);
        }
      } catch (error) {
        console.error(`Error syncing company ${hubspotCompany.name}:`, error);
        errors.push({ company: hubspotCompany.name, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      synced: synced.length,
      updated: updated.length,
      errors: errors.length,
      details: {
        synced,
        updated,
        errors,
      },
    });
  } catch (error) {
    console.error("Error syncing companies from HubSpot:", error);
    return NextResponse.json(
      { error: "Failed to sync companies from HubSpot", details: String(error) },
      { status: 500 }
    );
  }
}


