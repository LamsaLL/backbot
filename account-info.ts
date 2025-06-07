import dotenv from "dotenv";
import Account from "./src/Backpack/Authenticated/Account.js";
import Capital from "./src/Backpack/Authenticated/Capital.js";
import Futures from "./src/Backpack/Authenticated/Futures.js";
import AccountController from "./src/Controllers/AccountController.js";

dotenv.config();

class AccountInfoDisplay {
  async getCompleteAccountInfo() {
    console.log("💰 Backbot Account Information");
    console.log("==============================");

    try {
      // Check simulation mode first
      const isSimulation = process.env.SIMULATION_MODE === "true";
      console.log(
        `🔒 Mode: ${isSimulation ? "SIMULATION" : "⚠️  LIVE TRADING"}`
      );
      console.log("");

      // Get basic account info
      console.log("📊 Basic Account Details:");
      console.log("-".repeat(40));

      const account = await Account.getAccount();
      if (account) {
        console.log(`✅ Leverage Limit: ${account.leverageLimit || "N/A"}`);
        console.log(
          `✅ Futures Maker Fee: ${account.futuresMakerFee || "N/A"}`
        );
        console.log(`✅ Account Status: Active`);
        console.log(`✅ Leverage Limit: ${account.leverageLimit || "N/A"}x`);
        console.log(`✅ Account Status: Active`);
      } else {
        console.log("❌ Could not fetch basic account info");
        return;
      }

      // Get capital/balance information
      console.log("\n💵 Capital & Balances:");
      console.log("-".repeat(40));

      const balances = await Capital.getBalances();
      if (balances && balances.length > 0) {
        let totalValue = 0;

        balances.forEach((balance) => {
          const available = parseFloat(balance.available);
          const locked = parseFloat(balance.locked);
          const total = available + locked;

          if (total > 0.001) {
            // Only show significant balances
            console.log(`💰 ${balance.symbol}:`);
            console.log(`   Available: ${available.toFixed(6)}`);
            console.log(`   Locked: ${locked.toFixed(6)}`);
            console.log(`   Total: ${total.toFixed(6)}`);

            // Estimate USD value for major coins (rough estimate)
            if (balance.symbol === "USDC" || balance.symbol === "USDT") {
              totalValue += total;
            }
          }
        });

        if (totalValue > 0) {
          console.log(`\n💎 Estimated USD Value: $${totalValue.toFixed(2)}`);
        }
      } else {
        console.log("⚠️  No balance data available");
      }

      // Get collateral info
      console.log("\n🔒 Collateral Information:");
      console.log("-".repeat(40));

      const collateral = await Capital.getCollateral();
      if (collateral) {
        console.log(
          `💰 Net Equity: $${parseFloat(collateral.netEquity).toFixed(2)}`
        );
        console.log(
          `💵 Available: $${parseFloat(collateral.available).toFixed(2)}`
        );
        console.log(`🔒 Locked: $${parseFloat(collateral.locked).toFixed(2)}`);
        console.log(
          `📊 Initial Margin: $${parseFloat(collateral.initialMargin).toFixed(
            2
          )}`
        );
        console.log(
          `⚠️  Maintenance Margin: $${parseFloat(
            collateral.maintenanceMargin
          ).toFixed(2)}`
        );

        const marginRatio =
          (parseFloat(collateral.maintenanceMargin) /
            parseFloat(collateral.netEquity)) *
          100;
        console.log(`📈 Margin Usage: ${marginRatio.toFixed(2)}%`);
      } else {
        console.log("⚠️  No collateral data available");
      }

      // Get current positions
      console.log("\n📊 Current Positions:");
      console.log("-".repeat(40));

      const positions = await Futures.getOpenPositions();
      if (positions && positions.length > 0) {
        let totalPnL = 0;

        positions.forEach((pos) => {
          const pnl = parseFloat(pos.unrealizedPnl || "0");
          totalPnL += pnl;

          console.log(`🎯 ${pos.symbol}:`);
          console.log(`   Side: ${pos.side || "N/A"}`);
          console.log(`   Size: ${pos.netQuantity || "N/A"}`);
          console.log(`   Entry Price: $${pos.entryPrice || "N/A"}`);
          console.log(`   Mark Price: $${pos.markPrice || "N/A"}`);
          console.log(
            `   Unrealized PnL: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
          );
          console.log(
            `   Notional: $${parseFloat(pos.notionalValue || "0").toFixed(2)}`
          );
          console.log("");
        });

        console.log(
          `💰 Total Unrealized PnL: ${
            totalPnL >= 0 ? "+" : ""
          }$${totalPnL.toFixed(2)}`
        );
      } else {
        console.log("✅ No open positions");
      }

      // Get account controller data (processed info)
      console.log("\n🤖 Bot Account Analysis:");
      console.log("-".repeat(40));

      const botAccount = await AccountController.get();
      if (botAccount) {
        console.log(
          `💰 Available Capital: $${botAccount.capitalAvailable.toFixed(2)}`
        );
        console.log(
          `📊 Min Volume per Trade: $${botAccount.minVolumeDollar.toFixed(2)}`
        );
        console.log(`⚡ Leverage: ${botAccount.leverage}x`);
        console.log(`💸 Trading Fee: ${(botAccount.fee * 100).toFixed(4)}%`);
        console.log(`🎯 Available Markets: ${botAccount.markets.length}`);

        // Show top markets for trading
        if (botAccount.markets.length > 0) {
          console.log("\n📈 Top Trading Markets:");
          botAccount.markets.slice(0, 10).forEach((market, index) => {
            console.log(`   ${index + 1}. ${market.symbol}`);
          });
        }
      } else {
        console.log("⚠️  Could not get bot account analysis");
      }

      // Safety warnings
      console.log("\n🛡️  Safety Information:");
      console.log("-".repeat(40));
      console.log(
        `🔒 Simulation Mode: ${isSimulation ? "✅ ENABLED" : "❌ DISABLED"}`
      );

      if (!isSimulation) {
        console.log("⚠️  WARNING: You are in LIVE mode!");
        console.log("⚠️  Any trades placed will use real money!");
        console.log("⚠️  Set SIMULATION_MODE=true to test safely!");
      } else {
        console.log("✅ Safe to test - no real trades will be placed");
      }

      console.log("\n🎉 Account information retrieved successfully!");
    } catch (error: any) {
      console.error("❌ Error getting account info:", error.message);
      console.error(
        "💡 Make sure your API credentials are correct in .env file"
      );
    }
  }
}

// Export for use in other files
export default AccountInfoDisplay;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const accountInfo = new AccountInfoDisplay();
  accountInfo
    .getCompleteAccountInfo()
    .then(() => {
      console.log("\n🏁 Account info complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}
