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

        // Extract properties from HubSpot
        const props = hubspotCompany.properties || {};
        const email = props.email || props.company_email || null;
        const phone = props.phone || props.company_phone || null;
        const pricingTier = props.service_plan_tier || 
                          props.pricing_tier || 
                          props.pricing_tier_c || 
                          "basic";
        
        const normalizedTier = pricingTier.toLowerCase() === "standard" ? "standard" : 
                              pricingTier.toLowerCase() === "mega" ? "mega" : "basic";

        if (existing) {
          // Update existing company with all available fields
          await prisma.company.update({
            where: { id: existing.id },
            data: {
              name: hubspotCompany.name,
              email: email || existing.email, // Keep existing email if HubSpot doesn't have one
              phone: phone || existing.phone, // Keep existing phone if HubSpot doesn't have one
              pricingTier: normalizedTier,
            },
          });
          updated.push(hubspotCompany.name);
        } else {
          // Create new company
          await prisma.company.create({
            data: {
              hubspotId: hubspotCompany.hubspotId,
              name: hubspotCompany.name,
              email: email || null,
              phone: phone || null,
              pricingTier: normalizedTier,
            },
          });
          synced.push(hubspotCompany.name);
        }
      } catch (error: any) {
        console.error(`Error syncing company ${hubspotCompany.name}:`, error);
        const errorMessage = error?.message || String(error);
        errors.push({ 
          company: hubspotCompany.name, 
          hubspotId: hubspotCompany.hubspotId,
          error: errorMessage 
        });
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


