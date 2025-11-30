/**
 * Test Twilio Connection
 * 
 * Simple script to verify your Twilio credentials are working correctly
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { getTwilioClient, generateTwilioToken } from "../lib/twilio";

async function testTwilioConnection() {
  console.log("Testing Twilio connection...\n");

  try {
    // Test 1: Check environment variables
    console.log("1. Checking environment variables...");
    const requiredVars = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_API_KEY",
      "TWILIO_API_SECRET",
      "TWILIO_PHONE_NUMBER",
      "TWILIO_TWIML_APP_SID",
    ];

    const missingVars: string[] = [];
    for (const varName of requiredVars) {
      if (!process.env[varName] || process.env[varName]?.includes("your-")) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      console.log("   ⚠️  Missing or placeholder values found:");
      missingVars.forEach(v => console.log(`      - ${v}`));
      console.log("   💡 Please update these in .env.local\n");
    } else {
      console.log("   ✅ All environment variables are set\n");
    }

    // Test 2: Test Twilio client connection
    console.log("2. Testing Twilio client connection...");
    try {
      const client = getTwilioClient();
      // Try to fetch account info
      const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log("   ✅ Twilio client connected successfully");
      console.log(`   Account: ${account.friendlyName || account.sid}\n`);
    } catch (error: any) {
      console.log("   ❌ Twilio client connection failed");
      console.log(`   Error: ${error.message}\n`);
      console.log("   💡 Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN\n");
    }

    // Test 3: Test token generation
    console.log("3. Testing token generation...");
    try {
      const token = generateTwilioToken("test-user");
      if (token && token.length > 0) {
        console.log("   ✅ Token generated successfully");
        console.log(`   Token length: ${token.length} characters\n`);
      } else {
        console.log("   ⚠️  Token generation returned empty token\n");
      }
    } catch (error: any) {
      console.log("   ❌ Token generation failed");
      console.log(`   Error: ${error.message}\n`);
      console.log("   💡 Check your TWILIO_API_KEY, TWILIO_API_SECRET, and TWILIO_TWIML_APP_SID\n");
    }

    // Test 4: Verify phone number format
    console.log("4. Verifying phone number format...");
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (phoneNumber && phoneNumber.startsWith("+")) {
      console.log("   ✅ Phone number format looks correct");
      console.log(`   Phone: ${phoneNumber}\n`);
    } else {
      console.log("   ⚠️  Phone number should be in E.164 format (e.g., +1234567890)");
      console.log(`   Current: ${phoneNumber}\n`);
    }

    console.log("✅ Connection test complete!");
    console.log("\nSummary:");
    if (missingVars.length === 0) {
      console.log("- All environment variables are set ✅");
    } else {
      console.log("- Some environment variables need to be updated ⚠️");
    }
    console.log("- If all tests passed, you're ready to use Twilio calling!");
    console.log("- Restart your dev server after updating .env.local");

  } catch (error: any) {
    console.error("\n❌ Failed to test Twilio connection");
    console.error("Error:", error.message);
    console.error("\nPlease check:");
    console.error("1. All Twilio values are set in .env.local");
    console.error("2. Values are correct (not placeholders)");
    console.error("3. You've restarted your dev server after updating .env.local");
    process.exit(1);
  }
}

testTwilioConnection();

