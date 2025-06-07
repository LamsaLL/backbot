/**
 * System Tests Suite
 *
 * Tests integration between different system components
 */

import AccountController from "../../src/Controllers/AccountController.js";
import OrderController from "../../src/Controllers/OrderController.js";
import RiskManager from "../../src/Risk/RiskManager.js";
import Decision from "../../src/Decision/Decision.js";
import { TestSuite, TestResult } from "../index.js";

export class SystemTests implements TestSuite {
  name = "System Integration Tests";

  async run(): Promise<TestResult> {
    const results: Array<{
      name: string;
      status: "PASS" | "FAIL";
      message: string;
    }> = [];

    // Test 1: Account Controller
    try {
      const account = await AccountController.get();
      if (account && typeof account.capitalAvailable === "number") {
        results.push({
          name: "Account Controller",
          status: "PASS",
          message: `Account loaded: $${account.capitalAvailable.toFixed(
            2
          )} available`,
        });
      } else {
        results.push({
          name: "Account Controller",
          status: "FAIL",
          message: "Account controller returned invalid data",
        });
      }
    } catch (error) {
      results.push({
        name: "Account Controller",
        status: "FAIL",
        message: `Account controller error: ${error}`,
      });
    }

    // Test 2: Risk Manager Initialization
    try {
      const riskManager = new RiskManager({
        maxRiskPerTrade: 0.02,
        maxDailyLoss: 0.05,
        maxTotalExposure: 0.8,
        maxOpenPositions: 5,
        minVolumeUSD: 100,
        maxVolumeUSD: 5000,
        stopLossRequired: true,
        maxLeverage: 10,
      });

      if (riskManager) {
        results.push({
          name: "Risk Manager",
          status: "PASS",
          message: "Risk manager initialized successfully",
        });
      } else {
        results.push({
          name: "Risk Manager",
          status: "FAIL",
          message: "Risk manager initialization failed",
        });
      }
    } catch (error) {
      results.push({
        name: "Risk Manager",
        status: "FAIL",
        message: `Risk manager error: ${error}`,
      });
    }

    // Test 3: Decision Engine Initialization
    try {
      // Test that Decision can be accessed (it's a singleton)
      const riskManager = Decision.getRiskManager();
      if (riskManager) {
        results.push({
          name: "Decision Engine",
          status: "PASS",
          message: "Decision engine initialized and accessible",
        });
      } else {
        results.push({
          name: "Decision Engine",
          status: "FAIL",
          message: "Decision engine initialization issue",
        });
      }
    } catch (error) {
      results.push({
        name: "Decision Engine",
        status: "FAIL",
        message: `Decision engine error: ${error}`,
      });
    }

    // Test 4: Order Controller Basic Functions
    try {
      // Test getting recent orders (should not crash)
      const recentOrders = await OrderController.getRecentOpenOrders("BTC-USD");

      // This should return an array (even if empty)
      if (Array.isArray(recentOrders)) {
        results.push({
          name: "Order Controller",
          status: "PASS",
          message: `Order controller functional, ${recentOrders.length} recent orders`,
        });
      } else {
        results.push({
          name: "Order Controller",
          status: "FAIL",
          message: "Order controller returned non-array result",
        });
      }
    } catch (error) {
      results.push({
        name: "Order Controller",
        status: "FAIL",
        message: `Order controller error: ${error}`,
      });
    }

    // Test 5: Environment Configuration
    try {
      const requiredEnvVars = [
        "API_URL",
        "PUBLIC_KEY",
        "PRIVATE_KEY",
        "SIMULATION_MODE",
      ];

      const missingVars = requiredEnvVars.filter(
        (varName) => !process.env[varName]
      );

      if (missingVars.length === 0) {
        results.push({
          name: "Environment Configuration",
          status: "PASS",
          message: "All required environment variables are set",
        });
      } else {
        results.push({
          name: "Environment Configuration",
          status: "FAIL",
          message: `Missing environment variables: ${missingVars.join(", ")}`,
        });
      }
    } catch (error) {
      results.push({
        name: "Environment Configuration",
        status: "FAIL",
        message: `Environment check error: ${error}`,
      });
    }

    // Test 6: Risk Manager Position Validation
    try {
      const riskManager = new RiskManager({
        maxRiskPerTrade: 0.02,
        maxDailyLoss: 0.05,
        maxTotalExposure: 0.8,
        maxOpenPositions: 5,
        minVolumeUSD: 100,
        maxVolumeUSD: 5000,
        stopLossRequired: true,
        maxLeverage: 10,
      });

      const validation = await riskManager.validateNewPosition(
        "BTC-USD",
        1000, // $1000 position
        50000, // $50k entry
        48000, // $48k stop (4% risk)
        10000, // $10k account
        [], // no existing positions
        5 // 5x leverage
      );

      if (validation && typeof validation.isValid === "boolean") {
        results.push({
          name: "Risk Validation",
          status: "PASS",
          message: `Risk validation working: ${
            validation.isValid ? "Valid" : "Invalid"
          } - ${validation.reason}`,
        });
      } else {
        results.push({
          name: "Risk Validation",
          status: "FAIL",
          message: "Risk validation returned invalid result",
        });
      }
    } catch (error) {
      results.push({
        name: "Risk Validation",
        status: "FAIL",
        message: `Risk validation error: ${error}`,
      });
    }

    // Test 7: Simulation Mode Check
    try {
      const isSimulation = process.env.SIMULATION_MODE === "true";

      if (isSimulation) {
        results.push({
          name: "Simulation Mode",
          status: "PASS",
          message: "✅ Running in SIMULATION mode - Safe for testing",
        });
      } else {
        results.push({
          name: "Simulation Mode",
          status: "FAIL",
          message: "⚠️ Running in LIVE mode - Real trades may be placed!",
        });
      }
    } catch (error) {
      results.push({
        name: "Simulation Mode",
        status: "FAIL",
        message: `Simulation mode check error: ${error}`,
      });
    }

    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;

    return {
      passed,
      failed,
      total: results.length,
      details: results,
    };
  }
}
