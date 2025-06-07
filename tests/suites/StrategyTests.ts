/**
 * Strategy Tests Suite
 *
 * Tests trading strategy logic and implementation
 */

import { StrategyFactory } from "../../src/Strategies/index.js";
import { TestSuite, TestResult } from "../index.js";
import { Candle } from "../../src/types/index.js";

export class StrategyTests implements TestSuite {
  name = "Strategy Tests";

  async run(): Promise<TestResult> {
    const results: Array<{
      name: string;
      status: "PASS" | "FAIL";
      message: string;
    }> = [];

    // Test 1: Strategy Factory
    try {
      const availableStrategies = StrategyFactory.getAvailableStrategies();
      if (availableStrategies.length > 0) {
        results.push({
          name: "Strategy Factory",
          status: "PASS",
          message: `${
            availableStrategies.length
          } strategies available: ${availableStrategies.join(", ")}`,
        });
      } else {
        results.push({
          name: "Strategy Factory",
          status: "FAIL",
          message: "No strategies available",
        });
      }
    } catch (error) {
      results.push({
        name: "Strategy Factory",
        status: "FAIL",
        message: `Strategy factory error: ${error}`,
      });
    }

    // Test 2: BBEMA Strategy Initialization
    try {
      const strategy = await StrategyFactory.initializeStrategy(
        "BBEMA_VOLUME_FARMER",
        {}
      );
      if (strategy && strategy.name === "BB_EMA_VOLUME_FARMER") {
        results.push({
          name: "BBEMA Strategy Initialization",
          status: "PASS",
          message: "Strategy initialized successfully",
        });
      } else {
        results.push({
          name: "BBEMA Strategy Initialization",
          status: "FAIL",
          message: "Strategy initialization failed or incorrect name",
        });
      }
    } catch (error) {
      results.push({
        name: "BBEMA Strategy Initialization",
        status: "FAIL",
        message: `Strategy initialization error: ${error}`,
      });
    }

    // Test 3: Strategy Analysis with Mock Data
    try {
      const strategy = await StrategyFactory.initializeStrategy(
        "BBEMA_VOLUME_FARMER",
        {}
      );
      const mockCandles = this.generateMockCandles(100);
      const mockMarket = {
        symbol: "BTC-USD",
        baseSymbol: "BTC",
        quoteSymbol: "USD",
        decimal_price: 2,
        decimal_quantity: 4,
        minOrderSize: 20,
        tickSize: 0.01,
        marketType: "PERP" as const,
        orderBookState: "Open" as const,
      };
      const mockAccount = {
        capitalAvailable: 10000,
        leverage: 5,
        maxOpenOrders: 5,
        minVolumeDollar: 20,
        markets: [mockMarket],
      };

      const result = await strategy.analyze(
        mockCandles,
        mockMarket,
        mockAccount,
        [],
        []
      );

      if (result && ["LONG", "SHORT", "NEUTRAL"].includes(result.action)) {
        results.push({
          name: "Strategy Analysis",
          status: "PASS",
          message: `Analysis completed: ${result.action} - ${result.reason}`,
        });
      } else {
        results.push({
          name: "Strategy Analysis",
          status: "FAIL",
          message: "Invalid analysis result",
        });
      }
    } catch (error) {
      results.push({
        name: "Strategy Analysis",
        status: "FAIL",
        message: `Strategy analysis error: ${error}`,
      });
    }

    // Test 4: Strategy with Custom Configuration
    try {
      const customConfig = {
        BBEMA_RISK_PERC: "1.0",
        BBEMA_BB_LEN: "25",
        BBEMA_USE_VOL_FILTER: "true",
      };

      const strategy = await StrategyFactory.initializeStrategy(
        "BBEMA_VOLUME_FARMER",
        customConfig
      );
      const mockCandles = this.generateMockCandles(50);
      const mockMarket = {
        symbol: "ETH-USD",
        baseSymbol: "ETH",
        quoteSymbol: "USD",
        decimal_price: 2,
        decimal_quantity: 4,
        minOrderSize: 20,
        tickSize: 0.01,
        marketType: "PERP" as const,
        orderBookState: "Open" as const,
      };
      const mockAccount = {
        capitalAvailable: 5000,
        leverage: 3,
        maxOpenOrders: 3,
        minVolumeDollar: 20,
        markets: [mockMarket],
      };

      const result = await strategy.analyze(
        mockCandles,
        mockMarket,
        mockAccount,
        [],
        []
      );

      if (result) {
        results.push({
          name: "Custom Configuration",
          status: "PASS",
          message: `Custom config analysis: ${result.action}`,
        });
      } else {
        results.push({
          name: "Custom Configuration",
          status: "FAIL",
          message: "Custom configuration analysis failed",
        });
      }
    } catch (error) {
      results.push({
        name: "Custom Configuration",
        status: "FAIL",
        message: `Custom configuration error: ${error}`,
      });
    }

    // Test 5: Invalid Strategy Handling
    try {
      await StrategyFactory.initializeStrategy("INVALID_STRATEGY", {});
      results.push({
        name: "Invalid Strategy Handling",
        status: "FAIL",
        message: "Should have thrown error for invalid strategy",
      });
    } catch (error) {
      results.push({
        name: "Invalid Strategy Handling",
        status: "PASS",
        message: "Correctly rejected invalid strategy",
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

  private generateMockCandles(count: number): Candle[] {
    const candles: Candle[] = [];
    let basePrice = 50000 + Math.random() * 20000; // Random base price between 50k-70k

    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 0.02; // ±1% change
      const open = basePrice;
      const close = basePrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = 1000 + Math.random() * 5000;

      candles.push({
        symbol: "BTC-USD-PERP",
        interval: "5m",
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume.toFixed(0),
        timestamp: Date.now() - (count - i) * 300000, // 5-minute intervals
      });

      basePrice = close;
    }

    return candles;
  }
}
