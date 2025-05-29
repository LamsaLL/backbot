import dotenv from "dotenv";
import Account from "./src/Backpack/Authenticated/Account.js";
import Markets from "./src/Backpack/Public/Markets.js";

dotenv.config();

async function testConnection(): Promise<void> {
  console.log("🔍 Testing TypeScript API connection...");

  try {
    // Test public API (no auth required)
    const markets = await Markets.getMarkets();
    console.log("✅ Public API works - Markets found:", markets?.length || 0);

    // Test authenticated API
    const account = await Account.getAccount();
    if (account) {
      console.log("✅ Auth API works - Leverage limit:", account.leverageLimit);
      console.log(
        "✅ Account balance available:",
        account.balance?.length > 0 ? "Yes" : "No"
      );
    } else {
      console.log("❌ Auth API failed");
    }
  } catch (error: any) {
    console.error("❌ Connection test failed:", error.message);
  }
}

testConnection();
