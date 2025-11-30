/**
 * Test HubSpot Connection
 * 
 * Simple script to verify your HubSpot API key and scopes are working correctly
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { getHubspotClient } from "../lib/hubspot";

async function testHubSpotConnection() {
  console.log("Testing HubSpot connection...\n");

  try {
    const client = getHubspotClient();
    
    // Test 1: Fetch companies (should work with existing scopes)
    console.log("1. Testing Companies API...");
    try {
      const companies = await client.crm.companies.basicApi.getPage(1, undefined, ["name"]);
      console.log("   ✅ Companies API: Working");
      console.log(`   Found ${companies.results.length} company(ies)\n`);
    } catch (error: any) {
      console.log("   ❌ Companies API: Failed");
      console.log(`   Error: ${error.message}\n`);
    }

    // Test 2: Fetch tickets (should work with existing scopes)
    console.log("2. Testing Tickets API...");
    try {
      const tickets = await client.crm.tickets.basicApi.getPage(1, undefined, ["subject"]);
      console.log("   ✅ Tickets API: Working");
      console.log(`   Found ${tickets.results.length} ticket(s)\n`);
    } catch (error: any) {
      console.log("   ❌ Tickets API: Failed");
      console.log(`   Error: ${error.message}\n`);
    }

    // Test 3: Fetch contacts (should work with existing scopes)
    console.log("3. Testing Contacts API...");
    try {
      const contacts = await client.crm.contacts.basicApi.getPage(1, undefined, ["email"]);
      console.log("   ✅ Contacts API: Working");
      console.log(`   Found ${contacts.results.length} contact(s)\n`);
    } catch (error: any) {
      console.log("   ❌ Contacts API: Failed");
      console.log(`   Error: ${error.message}\n`);
    }

    // Test 4: Test Engagements API (optional - may not be available)
    console.log("4. Testing Engagements API (optional)...");
    try {
      // Check if engagements API is available
      if (client.crm?.engagements?.basicApi) {
        const engagements = await client.crm.engagements.basicApi.getPage(1);
        console.log("   ✅ Engagements API: Working");
        console.log(`   Found ${engagements.results?.length || 0} engagement(s)\n`);
        console.log("   💡 Call logging to HubSpot will work!\n");
      } else {
        console.log("   ⚠️  Engagements API: Not available in client");
        console.log("   💡 This is okay - calls will still work, just won't auto-log to HubSpot\n");
      }
    } catch (error: any) {
      if (error.statusCode === 403 || error.message?.includes("permission") || error.message?.includes("scope")) {
        console.log("   ⚠️  Engagements API: Not available (missing scope)");
        console.log("   💡 This is okay - calls will still work, just won't auto-log to HubSpot\n");
      } else {
        console.log("   ⚠️  Engagements API: Not available");
        console.log(`   Error: ${error.message || "API not accessible"}\n`);
        console.log("   💡 This is okay - calls will still work, just won't auto-log to HubSpot\n");
      }
    }

    // Test 5: Test Timeline API (optional - may not be available)
    console.log("5. Testing Timeline API (optional)...");
    try {
      // Timeline API might not be directly testable, but we can check if we can access events
      console.log("   ⚠️  Timeline API: Cannot test directly");
      console.log("   💡 If you added Timeline scope, Calling Extensions SDK should work\n");
    } catch (error: any) {
      console.log("   ⚠️  Timeline API: Not available\n");
    }

    console.log("✅ Connection test complete!");
    console.log("\nSummary:");
    console.log("- If Companies, Tickets, and Contacts work: Your basic integration is working ✅");
    console.log("- If Engagements works: Call logging to HubSpot will work ✅");
    console.log("- If Engagements doesn't work: Calls will still work, just won't auto-log ⚠️");
    console.log("- Calling Extensions SDK requires app registration (see HUBSPOT_CALLING_EXTENSIONS_SETUP.md)");

  } catch (error: any) {
    console.error("\n❌ Failed to connect to HubSpot");
    console.error("Error:", error.message);
    console.error("\nPlease check:");
    console.error("1. HUBSPOT_API_KEY is set in .env.local");
    console.error("2. The API key is correct (it may have changed when you added scopes)");
    console.error("3. You've restarted your dev server after updating .env.local");
    process.exit(1);
  }
}

testHubSpotConnection();

