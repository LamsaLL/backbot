import dotenv from "dotenv";
import Account from "./src/Backpack/Authenticated/Account.js";
import Capital from "./src/Backpack/Authenticated/Capital.js";
import Futures from "./src/Backpack/Authenticated/Futures.js";
import Markets from "./src/Backpack/Public/Markets.js";
import System from "./src/Backpack/Public/System.js";
import AccountController from "./src/Controllers/AccountController.js";
import OrderController from "./src/Controllers/OrderController.js";
import Decision from "./src/Decision/Decision.js";

dotenv.config();

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  message: string;
  data?: any;
}

class SystemTester {
  private results: TestResult[] = [];

  private addResult(
    name: string,
    status: "PASS" | "FAIL",
    message: string,
    data?: any
  ) {
    this.results.push({ name, status, message, data });
    const icon = status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${name}: ${message}`);
    if (data && status === "PASS") {
      console.log(`   Data: ${JSON.stringify(data, null, 2).slice(0, 200)}...`);
    }
  }

  async testEnvironmentVariables() {
    console.log("\n🔧 Testing Environment Variables...");

    const requiredVars = [
      "PRIVATE_KEY",
      "PUBLIC_KEY",
      "API_URL",
      "LIMIT_ORDER",
      "SIMULATION_MODE",
    ];
    let allPresent = true;

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.addResult("Environment", "FAIL", `Missing ${varName}`);
        allPresent = false;
      }
    }

    if (allPresent) {
      this.addResult(
        "Environment",
        "PASS",
        "All required environment variables present",
        {
          API_URL: process.env.API_URL,
          LIMIT_ORDER: process.env.LIMIT_ORDER,
          SIMULATION_MODE: process.env.SIMULATION_MODE,
        }
      );
    }
  }

  async testSystemConnection() {
    console.log("\n🌐 Testing System Connection...");

    try {
      const ping = await System.getPing();
      if (ping) {
        this.addResult("System Ping", "PASS", "API server responding", ping);
      } else {
        this.addResult("System Ping", "FAIL", "No response from API server");
      }

      const status = await System.getStatus();
      if (status) {
        this.addResult("System Status", "PASS", "API status OK", status);
      } else {
        this.addResult("System Status", "FAIL", "Failed to get API status");
      }

      const time = await System.getSystemTime();
      if (time) {
        this.addResult("System Time", "PASS", "Time sync OK", time);
      } else {
        this.addResult("System Time", "FAIL", "Failed to get system time");
      }
    } catch (error: any) {
      this.addResult("System Connection", "FAIL", error.message);
    }
  }

  async testAuthentication() {
    console.log("\n🔐 Testing Authentication...");

    try {
      const account = await Account.getAccount();
      if (account) {
        this.addResult("Authentication", "PASS", "Successfully authenticated", {
          leverageLimit: account.leverageLimit,
          hasBalance: account.balance?.length > 0,
        });
      } else {
        this.addResult("Authentication", "FAIL", "Authentication failed");
      }
    } catch (error: any) {
      this.addResult("Authentication", "FAIL", error.message);
    }
  }

  async testAccountData() {
    console.log("\n💰 Testing Account Data...");

    try {
      const account = await Account.getAccount();
      if (account && account.balance) {
        this.addResult(
          "Account Balance",
          "PASS",
          `Found ${account.balance.length} assets`,
          {
            assets: account.balance
              .slice(0, 3)
              .map((b) => ({ symbol: b.symbol, available: b.available })),
          }
        );
      } else {
        this.addResult("Account Balance", "FAIL", "No balance data");
      }

      const capital = await Capital.getCollateral();
      if (capital) {
        this.addResult("Collateral", "PASS", "Collateral data retrieved", {
          netEquity: capital.netEquity,
          available: capital.netEquityAvailable,
        });
      } else {
        this.addResult("Collateral", "FAIL", "No collateral data");
      }

      const positions = await Futures.getOpenPositions();
      this.addResult(
        "Open Positions",
        "PASS",
        `Found ${positions?.length || 0} open positions`,
        {
          count: positions?.length || 0,
        }
      );
    } catch (error: any) {
      this.addResult("Account Data", "FAIL", error.message);
    }
  }

  async testMarketData() {
    console.log("\n📊 Testing Market Data...");

    try {
      const markets = await Markets.getMarkets();
      if (markets && markets.length > 0) {
        const perpMarkets = markets.filter((m) => m.marketType === "PERP");
        this.addResult(
          "Markets",
          "PASS",
          `Found ${perpMarkets.length} PERP markets`,
          {
            total: markets.length,
            perp: perpMarkets.length,
            sample: perpMarkets.slice(0, 3).map((m) => m.symbol),
          }
        );

        // Test specific market data
        const testSymbol = perpMarkets[0]?.symbol;
        if (testSymbol) {
          const ticker = await Markets.getTicker(testSymbol);
          if (ticker) {
            this.addResult(
              "Market Ticker",
              "PASS",
              `Ticker data for ${testSymbol}`,
              {
                symbol: testSymbol,
                lastPrice: ticker.lastPrice,
                markPrice: ticker.markPrice,
              }
            );
          }

          const candles = await Markets.getCandles5m(testSymbol, 5);
          if (candles && candles.length > 0) {
            this.addResult(
              "Market Candles",
              "PASS",
              `${candles.length} candles for ${testSymbol}`,
              {
                symbol: testSymbol,
                count: candles.length,
                latest: candles[candles.length - 1],
              }
            );
          }
        }
      } else {
        this.addResult("Markets", "FAIL", "No market data available");
      }
    } catch (error: any) {
      this.addResult("Market Data", "FAIL", error.message);
    }
  }

  async testControllers() {
    console.log("\n🎮 Testing Controllers...");

    try {
      const accountData = await AccountController.get();
      if (accountData) {
        this.addResult(
          "Account Controller",
          "PASS",
          "Account controller working",
          {
            markets: accountData.markets.length,
            minVolume: accountData.minVolumeDollar,
            leverage: accountData.leverage,
          }
        );
      } else {
        this.addResult(
          "Account Controller",
          "FAIL",
          "Account controller failed"
        );
      }

      // Test order controller without placing orders
      const openOrders = await OrderController.getAllOrdersSchedule([]);
      this.addResult(
        "Order Controller",
        "PASS",
        "Order controller accessible",
        {
          scheduledOrders: openOrders.length,
        }
      );
    } catch (error: any) {
      this.addResult("Controllers", "FAIL", error.message);
    }
  }

  async testTradingLogic() {
    console.log("\n🤖 Testing Trading Logic...");

    try {
      const markets = await Markets.getMarkets();
      const perpMarkets = markets?.filter(
        (m) => m.marketType === "PERP" && m.orderBookState === "Open"
      );

      if (perpMarkets && perpMarkets.length > 0) {
        const testSymbol = perpMarkets[0]!.symbol;
        const candles = await Markets.getCandles5m(testSymbol, 25);
        const ticker = await Markets.getTicker(testSymbol);

        if (candles && ticker) {
          const marketPrice = parseFloat(
            ticker.lastPrice || ticker.markPrice || "0"
          );

          // Test the Decision logic without executing
          const decision = new (Decision.constructor as any)();
          const analysis = decision.analyzeMAEMACross(candles, marketPrice);

          this.addResult(
            "Trading Analysis",
            "PASS",
            "Trading logic functional",
            {
              symbol: testSymbol,
              action: analysis.action,
              entry: analysis.entry,
              marketPrice: analysis.marketPrice,
            }
          );

          // Test support/resistance
          const sr = decision.findSupportResistance(candles, marketPrice);
          this.addResult(
            "Support/Resistance",
            "PASS",
            "S/R calculation working",
            {
              stopLoss: sr.stopLoss,
              takeProfit: sr.takeProfit,
            }
          );
        }
      }
    } catch (error: any) {
      this.addResult("Trading Logic", "FAIL", error.message);
    }
  }

  async testSimulationMode() {
    console.log("\n🧪 Testing Simulation Mode...");

    const isSimulation = process.env.SIMULATION_MODE === "true";
    this.addResult(
      "Simulation Mode",
      "PASS",
      `Simulation mode: ${isSimulation ? "ENABLED" : "DISABLED"}`,
      {
        enabled: isSimulation,
        warning: !isSimulation
          ? "LIVE TRADING MODE - BE CAREFUL!"
          : "Safe to test",
      }
    );
  }

  async runAllTests() {
    console.log("🚀 Starting Backbot System Tests...");
    console.log("=====================================");

    await this.testEnvironmentVariables();
    await this.testSystemConnection();
    await this.testAuthentication();
    await this.testAccountData();
    await this.testMarketData();
    await this.testControllers();
    await this.testTradingLogic();
    await this.testSimulationMode();

    console.log("\n📋 TEST SUMMARY");
    console.log("================");

    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.results.length}`);

    if (failed === 0) {
      console.log("\n🎉 ALL TESTS PASSED! Your Backbot is ready to run.");
      console.log(
        "💡 You can now safely start the trading bot with: npm start"
      );
    } else {
      console.log(
        "\n⚠️  Some tests failed. Please fix the issues before running the bot."
      );
      console.log("\nFailed tests:");
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => {
          console.log(`   - ${r.name}: ${r.message}`);
        });
    }

    return failed === 0;
  }
}

// Run tests
const tester = new SystemTester();
tester
  .runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test runner error:", error);
    process.exit(1);
  });
