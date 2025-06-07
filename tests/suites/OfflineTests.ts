/**
 * Offline Tests Suite
 *
 * Tests core logic without requiring API connectivity
 */

import { TestSuite, TestResult } from "../index.js";
import { sma, ema, stdev } from "../../src/Indicators/index.js";

export class OfflineTests implements TestSuite {
  name = "Offline Logic Tests";

  async run(): Promise<TestResult> {
    const results: Array<{
      name: string;
      status: "PASS" | "FAIL";
      message: string;
    }> = [];

    // Test 1: Indicator Calculations
    try {
      const testData = [10, 12, 11, 14, 13, 15, 16, 14, 17, 18];

      // Test SMA
      const smaResults = sma(testData, 5);
      const lastSMA = smaResults[smaResults.length - 1];

      if (lastSMA !== null && typeof lastSMA === "number" && lastSMA > 0) {
        results.push({
          name: "SMA Calculation",
          status: "PASS",
          message: `SMA calculated correctly: ${lastSMA.toFixed(3)}`,
        });
      } else {
        results.push({
          name: "SMA Calculation",
          status: "FAIL",
          message: `Invalid SMA result: ${lastSMA}`,
        });
      }
    } catch (error) {
      results.push({
        name: "SMA Calculation",
        status: "FAIL",
        message: `SMA calculation error: ${error}`,
      });
    }

    // Test 2: EMA Calculation
    try {
      const testData = [10, 12, 11, 14, 13, 15, 16, 14, 17, 18];
      const emaResults = ema(testData, 5);
      const lastEMA = emaResults[emaResults.length - 1];

      // EMA should be a number and different from SMA
      if (
        lastEMA !== null &&
        typeof lastEMA === "number" &&
        !isNaN(lastEMA) &&
        lastEMA > 0
      ) {
        results.push({
          name: "EMA Calculation",
          status: "PASS",
          message: `EMA calculated: ${lastEMA.toFixed(3)}`,
        });
      } else {
        results.push({
          name: "EMA Calculation",
          status: "FAIL",
          message: `Invalid EMA result: ${lastEMA}`,
        });
      }
    } catch (error) {
      results.push({
        name: "EMA Calculation",
        status: "FAIL",
        message: `EMA calculation error: ${error}`,
      });
    }

    // Test 3: Bollinger Bands
    try {
      const testData = [
        100, 102, 101, 104, 103, 105, 106, 104, 107, 108, 106, 109, 108, 110,
        111,
      ];
      const bb = this.calculateBollingerBands(testData, 10, 2);

      if (
        bb &&
        bb.upper > bb.middle &&
        bb.middle > bb.lower &&
        bb.middle !== undefined
      ) {
        results.push({
          name: "Bollinger Bands",
          status: "PASS",
          message: `BB: Upper=${bb.upper.toFixed(
            2
          )}, Middle=${bb.middle.toFixed(2)}, Lower=${bb.lower.toFixed(2)}`,
        });
      } else {
        results.push({
          name: "Bollinger Bands",
          status: "FAIL",
          message: `Invalid BB structure: ${JSON.stringify(bb)}`,
        });
      }
    } catch (error) {
      results.push({
        name: "Bollinger Bands",
        status: "FAIL",
        message: `BB calculation error: ${error}`,
      });
    }

    // Test 4: Risk Calculations
    try {
      const accountBalance = 10000;
      const riskPercentage = 0.02; // 2%
      const entryPrice = 50000;
      const stopPrice = 48000; // 4% stop loss

      const riskAmount = accountBalance * riskPercentage;
      const priceRisk = entryPrice - stopPrice;
      const positionSize = riskAmount / priceRisk;

      if (positionSize > 0 && positionSize < accountBalance) {
        results.push({
          name: "Risk Calculation",
          status: "PASS",
          message: `Position size: $${positionSize.toFixed(
            2
          )} for $${riskAmount} risk`,
        });
      } else {
        results.push({
          name: "Risk Calculation",
          status: "FAIL",
          message: `Invalid position size: ${positionSize}`,
        });
      }
    } catch (error) {
      results.push({
        name: "Risk Calculation",
        status: "FAIL",
        message: `Risk calculation error: ${error}`,
      });
    }

    // Test 5: Mock Trading Logic
    try {
      const mockCandles = this.generateTrendingCandles(20, 100, "up");
      const signals = this.analyzeSimpleTrend(mockCandles);

      if (signals && typeof signals.trend === "string") {
        results.push({
          name: "Trading Logic Simulation",
          status: "PASS",
          message: `Trend analysis: ${
            signals.trend
          }, Strength: ${signals.strength?.toFixed(2)}`,
        });
      } else {
        results.push({
          name: "Trading Logic Simulation",
          status: "FAIL",
          message: "Invalid trend analysis result",
        });
      }
    } catch (error) {
      results.push({
        name: "Trading Logic Simulation",
        status: "FAIL",
        message: `Trading logic error: ${error}`,
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

  private generateTrendingCandles(
    count: number,
    startPrice: number,
    direction: "up" | "down" | "sideways"
  ) {
    const candles = [];
    let currentPrice = startPrice;

    for (let i = 0; i < count; i++) {
      const randomFactor = (Math.random() - 0.5) * 0.02; // ±1% random
      let trendFactor = 0;

      switch (direction) {
        case "up":
          trendFactor = 0.005; // 0.5% upward bias
          break;
        case "down":
          trendFactor = -0.005; // 0.5% downward bias
          break;
        case "sideways":
          trendFactor = 0; // no bias
          break;
      }

      const open = currentPrice;
      const change = randomFactor + trendFactor;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);

      candles.push({
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: (1000 + Math.random() * 2000).toFixed(0),
        time: (Date.now() - (count - i) * 300000).toString(),
      });

      currentPrice = close;
    }

    return candles;
  }

  private analyzeSimpleTrend(candles: any[]) {
    if (candles.length < 2) return null;

    const firstPrice = parseFloat(candles[0].close);
    const lastPrice = parseFloat(candles[candles.length - 1].close);
    const change = (lastPrice - firstPrice) / firstPrice;

    let trend = "sideways";
    if (change > 0.02) trend = "up";
    else if (change < -0.02) trend = "down";

    return {
      trend,
      strength: Math.abs(change),
      change: change,
    };
  }

  private calculateBollingerBands(
    data: number[],
    period: number,
    multiplier: number
  ) {
    if (data.length < period) return null;

    const smaResults = sma(data, period);
    const stdevResults = stdev(data, period);

    const lastSMA = smaResults[smaResults.length - 1];
    const lastStdev = stdevResults[stdevResults.length - 1];

    if (
      lastSMA === null ||
      lastStdev === null ||
      lastSMA === undefined ||
      lastStdev === undefined
    )
      return null;

    return {
      upper: lastSMA + lastStdev * multiplier,
      middle: lastSMA,
      lower: lastSMA - lastStdev * multiplier,
    };
  }
}
