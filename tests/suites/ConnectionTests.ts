/**
 * Connection Tests Suite
 *
 * Tests API connectivity and authentication
 */

import Account from "../../src/Backpack/Authenticated/Account.js";
import Markets from "../../src/Backpack/Public/Markets.js";
import System from "../../src/Backpack/Public/System.js";
import { TestSuite, TestResult } from "../index.js";

export class ConnectionTests implements TestSuite {
  name = "Connection Tests";

  async run(): Promise<TestResult> {
    const results: Array<{
      name: string;
      status: "PASS" | "FAIL";
      message: string;
    }> = [];

    // Test 1: Environment Variables
    try {
      const hasKeys = !!(process.env.PUBLIC_KEY && process.env.PRIVATE_KEY);
      const hasUrl = !!process.env.API_URL;

      if (hasKeys && hasUrl) {
        results.push({
          name: "Environment Variables",
          status: "PASS",
          message: "All required environment variables are set",
        });
      } else {
        results.push({
          name: "Environment Variables",
          status: "FAIL",
          message: `Missing: ${!hasKeys ? "API keys" : ""} ${
            !hasUrl ? "API URL" : ""
          }`,
        });
      }
    } catch (error) {
      results.push({
        name: "Environment Variables",
        status: "FAIL",
        message: `Error checking environment: ${error}`,
      });
    }

    // Test 2: Public API (System Status)
    try {
      const systemStatus = await System.getStatus();
      if (systemStatus) {
        results.push({
          name: "Public API - System Status",
          status: "PASS",
          message: `System status: ${systemStatus.status || "OK"}`,
        });
      } else {
        results.push({
          name: "Public API - System Status",
          status: "FAIL",
          message: "No system status returned",
        });
      }
    } catch (error) {
      results.push({
        name: "Public API - System Status",
        status: "FAIL",
        message: `System status failed: ${error}`,
      });
    }

    // Test 3: Public API (Markets)
    try {
      const markets = await Markets.getMarkets();
      if (markets && markets.length > 0) {
        results.push({
          name: "Public API - Markets",
          status: "PASS",
          message: `Retrieved ${markets.length} markets`,
        });
      } else {
        results.push({
          name: "Public API - Markets",
          status: "FAIL",
          message: "No markets data returned",
        });
      }
    } catch (error) {
      results.push({
        name: "Public API - Markets",
        status: "FAIL",
        message: `Markets API failed: ${error}`,
      });
    }

    // Test 4: Authenticated API (Account)
    try {
      const account = await Account.getAccount();
      if (account && account.balance) {
        results.push({
          name: "Authenticated API - Account",
          status: "PASS",
          message: `Account access OK, balance entries: ${account.balance.length}`,
        });
      } else {
        results.push({
          name: "Authenticated API - Account",
          status: "FAIL",
          message: "Account data incomplete or missing",
        });
      }
    } catch (error) {
      results.push({
        name: "Authenticated API - Account",
        status: "FAIL",
        message: `Account API failed: ${error}`,
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
