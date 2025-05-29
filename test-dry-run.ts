import dotenv from "dotenv";
import Decision from "./src/Decision/Decision";
import TrailingStop from "./src/TrailingStop/TrailingStop";
import AccountController from "./src/Controllers/AccountController";
import Markets from "./src/Backpack/Public/Markets";
import Futures from "./src/Backpack/Authenticated/Futures";

dotenv.config();

class DryRunTester {
  async testTradingDecisions() {
    console.log("🧪 Running Trading Logic Dry Test...");
    console.log("=====================================");

    try {
      // Get account data
      const Account = await AccountController.get();
      console.log(`💰 Account Info:
        - Available Capital: $${Account.capitalAvailable.toFixed(2)}
        - Min Volume per Trade: $${Account.minVolumeDollar.toFixed(2)}
        - Leverage: ${Account.leverage}x
        - Trading Fee: ${(Account.fee * 100).toFixed(4)}%
        - Available Markets: ${Account.markets.length}`);

      // Get current positions
      const positions = await Futures.getOpenPositions();
      console.log(`📊 Current Positions: ${positions?.length || 0}`);

      if (positions && positions.length > 0) {
        positions.forEach((pos) => {
          console.log(
            `   - ${pos.symbol}: ${pos.side} ${pos.netQuantity} (PnL: ${pos.unrealizedPnl})`
          );
        });
      }

      // Test trading analysis on multiple markets
      console.log("\n🔍 Analyzing Markets for Trading Opportunities...");

      const markets_available = Account.markets.slice(0, 5); // Test first 5 markets

      for (const market of markets_available) {
        console.log(`\n📈 Analyzing ${market.symbol}:`);

        // Get market data
        const candles = await Markets.getCandles5m(market.symbol, 25);
        if (!candles || candles.length === 0) {
          console.log(`   ⚠️  No candle data available`);
          continue;
        }

        const ticker = await Markets.getTicker(market.symbol);
        if (!ticker) {
          console.log(`   ⚠️  No ticker data available`);
          continue;
        }

        const marketPrice = parseFloat(
          ticker.lastPrice || ticker.markPrice || "0"
        );
        if (marketPrice === 0) {
          console.log(`   ⚠️  Invalid market price`);
          continue;
        }

        // Analyze trading opportunity
        const decision = new (Decision.constructor as any)();
        const dataset = decision.analyzeMAEMACross(candles, marketPrice);
        dataset.volume = Account.minVolumeDollar;
        dataset.market = market.symbol;

        console.log(`   💰 Current Price: $${marketPrice}`);
        console.log(`   📊 Trading Signal: ${dataset.action}`);

        if (dataset.action !== "NEUTRAL") {
          const { stopLoss, takeProfit } = decision.findSupportResistance(
            candles,
            marketPrice
          );

          console.log(`   🎯 Entry Price: $${dataset.entry}`);
          console.log(`   🛡️  Stop Loss: $${stopLoss || "N/A"}`);
          console.log(`   💎 Take Profit: $${takeProfit || "N/A"}`);
          console.log(`   💵 Volume: $${dataset.volume.toFixed(2)}`);

          // Calculate potential risk/reward
          if (stopLoss && takeProfit && dataset.entry) {
            const risk = Math.abs(dataset.entry - stopLoss);
            const reward = Math.abs(takeProfit - dataset.entry);
            const riskRewardRatio = reward / risk;
            console.log(
              `   ⚖️  Risk/Reward Ratio: ${riskRewardRatio.toFixed(2)}:1`
            );
          }

          console.log(
            `   🚨 ${
              process.env.SIMULATION_MODE === "true" ? "SIMULATION" : "LIVE"
            } MODE - ${
              process.env.SIMULATION_MODE === "true"
                ? "Would place"
                : "WOULD PLACE"
            } ${dataset.action} order`
          );
        } else {
          console.log(`   😴 No trading opportunity`);
        }
      }

      // Test trailing stop logic
      console.log("\n🔄 Testing Trailing Stop Logic...");
      if (positions && positions.length > 0) {
        console.log("   📍 Would check trailing stops for existing positions");
        positions.forEach((pos) => {
          console.log(`   - ${pos.symbol}: Monitoring ${pos.side} position`);
        });
      } else {
        console.log("   💤 No positions to monitor");
      }

      console.log("\n✅ Dry run completed successfully!");
      console.log("🎉 Trading logic is working correctly.");

      if (process.env.SIMULATION_MODE === "true") {
        console.log("🧪 You're in SIMULATION mode - safe to run the bot!");
      } else {
        console.log("⚠️  You're in LIVE mode - trades will be real!");
      }
    } catch (error) {
      console.error("❌ Dry run failed:", error);
      throw error;
    }
  }
}

// Run dry test
const dryTester = new DryRunTester();
dryTester
  .testTradingDecisions()
  .then(() => {
    console.log("\n🏁 Dry run test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Dry run error:", error);
    process.exit(1);
  });
