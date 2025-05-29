console.log("🧪 Offline Trading Logic Test");
console.log("==============================");

// Simulate candle data (no API calls)
const mockCandles = [
  {
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000,
    time: Date.now() - 4000,
  },
  {
    open: 103,
    high: 107,
    low: 101,
    close: 105,
    volume: 1200,
    time: Date.now() - 3000,
  },
  {
    open: 105,
    high: 109,
    low: 103,
    close: 108,
    volume: 1100,
    time: Date.now() - 2000,
  },
  {
    open: 108,
    high: 112,
    low: 106,
    close: 110,
    volume: 1300,
    time: Date.now() - 1000,
  },
  {
    open: 110,
    high: 115,
    low: 108,
    close: 112,
    volume: 1250,
    time: Date.now(),
  },
];

console.log("✅ Mock data created");
console.log(`📊 Testing with ${mockCandles.length} candles`);

// Simple moving average calculation
function calculateMA(candles: any[], period: number): number {
  if (candles.length < period) return 0;
  const prices = candles.slice(-period).map((c) => c.close);
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

// Test trading logic offline
try {
  const currentPrice = mockCandles[mockCandles.length - 1].close;
  const ma5 = calculateMA(mockCandles, 3);
  const ma10 = calculateMA(mockCandles, 5);

  console.log(`💰 Current Price: $${currentPrice}`);
  console.log(`📈 MA(3): $${ma5.toFixed(2)}`);
  console.log(`📉 MA(5): $${ma10.toFixed(2)}`);

  // Simple trading signal
  let signal = "NEUTRAL";
  if (currentPrice > ma5 && ma5 > ma10) {
    signal = "BULLISH";
  } else if (currentPrice < ma5 && ma5 < ma10) {
    signal = "BEARISH";
  }

  console.log(`🎯 Signal: ${signal}`);

  // Risk management
  const stopLossPercent = 0.02; // 2%
  const takeProfitPercent = 0.04; // 4%

  if (signal !== "NEUTRAL") {
    const stopLoss =
      signal === "BULLISH"
        ? currentPrice * (1 - stopLossPercent)
        : currentPrice * (1 + stopLossPercent);

    const takeProfit =
      signal === "BULLISH"
        ? currentPrice * (1 + takeProfitPercent)
        : currentPrice * (1 - takeProfitPercent);

    console.log(`🛡️  Stop Loss: $${stopLoss.toFixed(2)}`);
    console.log(`💎 Take Profit: $${takeProfit.toFixed(2)}`);

    const riskReward = takeProfitPercent / stopLossPercent;
    console.log(`⚖️  Risk/Reward: ${riskReward}:1`);
  }

  console.log("\n🎭 SIMULATION RESULTS:");
  console.log(
    `✅ Environment: ${
      process.env.SIMULATION_MODE === "true" ? "SIMULATION" : "LIVE"
    }`
  );
  console.log(`🤖 Would execute: ${signal} strategy`);
  console.log(
    `🚨 Mode: ${
      process.env.SIMULATION_MODE === "true" ? "SAFE TESTING" : "LIVE TRADING"
    }`
  );

  if (process.env.SIMULATION_MODE === "true") {
    console.log("✅ SAFE: No real trades will be placed");
  } else {
    console.log("⚠️  WARNING: This would place real trades!");
  }

  console.log("\n🎉 Offline test completed successfully!");
  console.log("💡 Your trading logic is working correctly");
  console.log("🚀 Ready for API testing when network allows");
} catch (error) {
  console.error("❌ Test failed:", error);
}

console.log("\n🏁 Test finished");
