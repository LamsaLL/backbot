import { StrategyFactory } from "./src/Strategies/index.js";
import { Candle, Market } from "./src/types/index.js";

// Mock data for testing
function generateMockCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let basePrice = 50000;

  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.5) * 1000;
    const open = basePrice + variance;
    const close = open + (Math.random() - 0.5) * 500;
    const high = Math.max(open, close) + Math.random() * 200;
    const low = Math.min(open, close) - Math.random() * 200;

    candles.push({
      symbol: "BTC-USD-PERP",
      interval: "1m",
      open: open.toString(),
      high: high.toString(),
      low: low.toString(),
      close: close.toString(),
      volume: (Math.random() * 1000000 + 100000).toString(),
      timestamp: Date.now() + i * 60000, // 1 minute intervals
    });

    basePrice = close;
  }

  return candles;
}

const mockMarket: Market = {
  symbol: "BTC-USD",
  baseSymbol: "BTC",
  quoteSymbol: "USD",
  decimal_price: 2,
  decimal_quantity: 6,
  minOrderSize: 100,
  tickSize: 0.01,
  marketType: "PERP",
  orderBookState: "Open",
};

const mockAccount = {
  capitalAvailable: 10000,
  leverage: 10,
  maxOpenOrders: 5,
  minVolumeDollar: 100,
  markets: [mockMarket],
};

async function testStrategy(
  strategyName: string,
  config: Record<string, string> = {}
) {
  console.log(`\n🧪 Testing Strategy: ${strategyName}`);
  console.log("=".repeat(50));

  try {
    // Initialize strategy
    const strategy = await StrategyFactory.initializeStrategy(
      strategyName,
      config
    );
    console.log(`✅ Strategy initialized: ${strategy.name}`);

    // Generate test data
    const candles = generateMockCandles(100);
    console.log(`📊 Generated ${candles.length} mock candles`);

    // Test analysis
    const result = await strategy.analyze(
      candles,
      mockMarket,
      mockAccount,
      [], // No open positions
      [] // No open positions
    );

    console.log("\n📈 Analysis Result:");
    if (result) {
      console.log(`  Action: ${result.action}`);
      console.log(`  Symbol: ${result.symbol}`);
      console.log(`  Market Price: $${result.marketPrice?.toFixed(2)}`);
      console.log(`  Entry: $${result.entry?.toFixed(2)}`);
      console.log(`  Stop Loss: $${result.stopLoss?.toFixed(2)}`);
      console.log(`  Take Profit 1: $${result.takeProfit1?.toFixed(2)}`);
      console.log(`  Take Profit 2: $${result.takeProfit2?.toFixed(2)}`);
      console.log(`  Volume: $${result.volume?.toFixed(2)}`);
      console.log(`  Partial Close %: ${result.partialClosePct}%`);
      console.log(`  Reason: ${result.reason}`);

      if (result.trailingStopParams) {
        console.log(
          `  Trailing Stop ATR: ${result.trailingStopParams.atrValue?.toFixed(
            4
          )}`
        );
        console.log(
          `  Trail Multiplier: ${result.trailingStopParams.trailMultiplier}`
        );
      }
    } else {
      console.log("  No result returned");
    }

    return true;
  } catch (error) {
    console.error(`❌ Error testing strategy: ${error}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting Strategy Tests");
  console.log("=".repeat(60));

  // Test available strategies
  const strategies = StrategyFactory.getAvailableStrategies();
  console.log(`📋 Available strategies: ${strategies.join(", ")}`);

  let passCount = 0;
  let totalTests = 0;

  // Test BB-EMA Volume Farmer with default config
  totalTests++;
  if (await testStrategy("BBEMA_VOLUME_FARMER")) {
    passCount++;
  }

  // Test BB-EMA Volume Farmer with custom config
  totalTests++;
  if (
    await testStrategy("BBEMA_VOLUME_FARMER", {
      BBEMA_RISK_PERC: "1.0",
      BBEMA_USE_VOL_FILTER: "true",
      BBEMA_USE_RANGE_TRADES: "true",
      BBEMA_PARTIAL_RR: "1.0",
      BBEMA_REWARD_RR: "3.0",
    })
  ) {
    passCount++;
  }

  // Test error handling with invalid strategy
  totalTests++;
  try {
    await StrategyFactory.initializeStrategy("INVALID_STRATEGY", {});
    console.log("❌ Should have thrown error for invalid strategy");
  } catch (error) {
    console.log("✅ Correctly handled invalid strategy error");
    passCount++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`🎯 Test Results: ${passCount}/${totalTests} passed`);

  if (passCount === totalTests) {
    console.log(
      "🎉 All tests passed! Strategy implementation is working correctly."
    );
    process.exit(0);
  } else {
    console.log("⚠️ Some tests failed. Please check the implementation.");
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
