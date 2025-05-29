import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Simple Environment Test");
console.log("==========================");

console.log("✅ Environment Variables:");
console.log("- SIMULATION_MODE:", process.env.SIMULATION_MODE);
console.log("- API_URL:", process.env.API_URL);
console.log("- LIMIT_ORDER:", process.env.LIMIT_ORDER);
console.log("- PUBLIC_KEY set:", !!process.env.PUBLIC_KEY);
console.log("- PRIVATE_KEY set:", !!process.env.PRIVATE_KEY);

console.log("\n🎯 Safety Check:");
if (process.env.SIMULATION_MODE === "true") {
  console.log("✅ SIMULATION MODE - Safe to test!");
} else {
  console.log("⚠️  LIVE MODE - Real trades will be placed!");
}

console.log("\n✅ Basic test completed successfully!");

console.log("\n🧪 Testing Core API Access...");

// Test if we can import and use basic modules
try {
  const Markets = await import("./src/Backpack/Public/Markets.js");
  console.log("✅ Markets module imported successfully");

  // Test basic market data (no auth needed)
  const markets = await Markets.default.getMarkets();
  if (markets && markets.length > 0) {
    console.log(
      `✅ API Connection working - ${markets.length} markets available`
    );
    console.log(
      `📊 Sample markets: ${markets
        .slice(0, 3)
        .map((m: any) => m.symbol)
        .join(", ")}`
    );
  } else {
    console.log("⚠️  No markets data received");
  }
} catch (error: any) {
  console.log(`❌ API test failed: ${error.message}`);
}

console.log("\n🎉 Your setup is ready for safe testing!");
console.log("💡 Next steps:");
console.log("   1. Run: npm run build && node dist/test-connection.js");
console.log("   2. Run: npm run build && node dist/test-system.js");
console.log(
  "   3. Once all tests pass, you can run the full bot safely in SIMULATION mode"
);
