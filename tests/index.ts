/**
 * Backbot Comprehensive Test Suite
 *
 * This is the main test runner that consolidates all testing functionality
 * into a single, well-organized test suite.
 */

import dotenv from "dotenv";
import { ConnectionTests } from "./suites/ConnectionTests.js";
import { StrategyTests } from "./suites/StrategyTests.js";
import { SystemTests } from "./suites/SystemTests.js";
import { OfflineTests } from "./suites/OfflineTests.js";

dotenv.config();

interface TestSuite {
  name: string;
  run(): Promise<TestResult>;
}

interface TestResult {
  passed: number;
  failed: number;
  total: number;
  details: Array<{
    name: string;
    status: "PASS" | "FAIL";
    message: string;
  }>;
}

class BackbotTestRunner {
  private suites: TestSuite[] = [];

  constructor() {
    this.suites = [
      new ConnectionTests(),
      new OfflineTests(),
      new StrategyTests(),
      new SystemTests(),
    ];
  }

  async runAll(): Promise<void> {
    console.log("🚀 Backbot Test Suite");
    console.log("=".repeat(50));
    console.log(
      `Environment: ${
        process.env.SIMULATION_MODE === "true" ? "SIMULATION" : "LIVE"
      }`
    );
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    for (const suite of this.suites) {
      console.log(`\n📋 Running ${suite.name}...`);
      console.log("-".repeat(40));

      try {
        const result = await suite.run();
        totalPassed += result.passed;
        totalFailed += result.failed;
        totalTests += result.total;

        console.log(`\n📊 ${suite.name} Results:`);
        console.log(`   ✅ Passed: ${result.passed}`);
        console.log(`   ❌ Failed: ${result.failed}`);
        console.log(`   📋 Total:  ${result.total}`);

        if (result.failed > 0) {
          console.log("\n🔍 Failed Tests:");
          result.details
            .filter((t) => t.status === "FAIL")
            .forEach((test) =>
              console.log(`   ❌ ${test.name}: ${test.message}`)
            );
        }
      } catch (error) {
        console.error(`❌ Suite "${suite.name}" crashed:`, error);
        totalFailed++;
        totalTests++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎯 Final Results");
    console.log("=".repeat(50));
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📋 Total:  ${totalTests}`);
    console.log(
      `📊 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`
    );

    if (totalFailed === 0) {
      console.log("\n🎉 All tests passed! System is ready.");
    } else {
      console.log(
        `\n⚠️  ${totalFailed} test(s) failed. Please review and fix.`
      );
      process.exit(1);
    }
  }

  async runSuite(suiteName: string): Promise<void> {
    const suite = this.suites.find((s) =>
      s.name.toLowerCase().includes(suiteName.toLowerCase())
    );

    if (!suite) {
      console.error(`❌ Test suite "${suiteName}" not found.`);
      console.log("Available suites:");
      this.suites.forEach((s) => console.log(`  - ${s.name}`));
      return;
    }

    console.log(`🚀 Running ${suite.name} only...`);
    const result = await suite.run();

    console.log(`\n📊 Results: ${result.passed}/${result.total} passed`);
    if (result.failed > 0) {
      process.exit(1);
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);
const runner = new BackbotTestRunner();

if (args.length > 0) {
  // Run specific suite
  runner.runSuite(args[0] || "all");
} else {
  // Run all tests
  runner.runAll();
}

export { TestSuite, TestResult, BackbotTestRunner };
