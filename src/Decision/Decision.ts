import Futures from "../Backpack/Authenticated/Futures.js";
import Order from "../Backpack/Authenticated/Order.js";
import OrderController from "../Controllers/OrderController.js";
import AccountController from "../Controllers/AccountController.js";
import Markets from "../Backpack/Public/Markets.js";
import RiskManager from "../Risk/RiskManager.js";
import { Candle, Position, Market } from "../types/index.js";
import {
  StrategyFactory,
  IStrategy,
  AnalysisResult as StrategyAnalysisResult,
  AccountData,
} from "../Strategies/index.js";

interface AnalysisResult {
  action: "LONG" | "SHORT" | "NEUTRAL";
  entry: number | null;
  marketPrice: number;
  volume?: number;
  market?: string;
  stop?: number | null;
  target?: number | null;
}

interface SupportResistance {
  stopLoss: number | null;
  takeProfit: number | null;
}

class Decision {
  private riskManager: RiskManager;
  private currentStrategy: IStrategy | null = null;
  private strategyName: string;

  constructor() {
    // Initialize risk manager with environment-based configuration
    this.riskManager = new RiskManager({
      maxRiskPerTrade: parseFloat(process.env.MAX_RISK_PER_TRADE || "0.02"),
      maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || "0.05"),
      maxTotalExposure: parseFloat(process.env.MAX_TOTAL_EXPOSURE || "0.80"),
      maxOpenPositions: parseInt(process.env.LIMIT_ORDER || "5"),
      minVolumeUSD: parseFloat(process.env.MIN_VOLUME_USD || "100"),
      maxVolumeUSD: parseFloat(process.env.MAX_VOLUME_USD || "5000"),
      stopLossRequired: process.env.REQUIRE_STOP_LOSS === "true",
      maxLeverage: parseInt(process.env.MAX_LEVERAGE || "10"),
    });

    // Initialize strategy
    this.strategyName = process.env.TRADING_STRATEGY || "BBEMA_VOLUME_FARMER";
    this.initializeStrategy();
  }

  private async initializeStrategy(): Promise<void> {
    try {
      // Get strategy configuration from environment variables
      const strategyConfig = this.getStrategyConfigFromEnv();

      this.currentStrategy = await StrategyFactory.initializeStrategy(
        this.strategyName,
        strategyConfig
      );

      console.log(
        `🎯 Trading strategy initialized: ${this.currentStrategy.name}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to initialize strategy "${this.strategyName}":`,
        error
      );
      console.log("🔄 Falling back to default BBEMA_VOLUME_FARMER strategy");

      // Fallback to default strategy
      this.currentStrategy = await StrategyFactory.initializeStrategy(
        "BBEMA_VOLUME_FARMER",
        {}
      );
    }
  }

  private getStrategyConfigFromEnv(): Record<string, string> {
    const config: Record<string, string> = {};

    // Get all environment variables that start with strategy prefixes
    const envVars = process.env;
    const strategyPrefixes = ["BBEMA_"];

    for (const [key, value] of Object.entries(envVars)) {
      if (
        strategyPrefixes.some((prefix) => key.startsWith(prefix)) &&
        value !== undefined
      ) {
        config[key] = value;
      }
    }

    return config;
  }

  async switchStrategy(
    strategyName: string,
    config?: Record<string, string>
  ): Promise<void> {
    try {
      const strategyConfig = config || this.getStrategyConfigFromEnv();
      this.currentStrategy = await StrategyFactory.initializeStrategy(
        strategyName,
        strategyConfig
      );
      this.strategyName = strategyName;
      console.log(`🔄 Switched to strategy: ${this.currentStrategy.name}`);
    } catch (error) {
      console.error(
        `❌ Failed to switch to strategy "${strategyName}":`,
        error
      );
      throw error;
    }
  }

  async analyze(): Promise<void> {
    try {
      // Ensure strategy is initialized
      if (!this.currentStrategy) {
        await this.initializeStrategy();
      }

      const positions = await Futures.getOpenPositions();
      const Account = await AccountController.get();

      // Check if trading should be halted due to daily losses
      const haltCheck = this.riskManager.shouldHaltTrading(
        Account.capitalAvailable
      );
      if (haltCheck.halt) {
        console.log(`🚨 Trading halted: ${haltCheck.reason}`);
        return;
      }

      // Get current risk metrics
      const riskMetrics = this.riskManager.getRiskMetrics(
        positions || [],
        Account.capitalAvailable
      );
      console.log(`📊 Risk Metrics:
        - Total Positions: ${riskMetrics.totalPositions}/${
        Account.maxOpenOrders || "N/A"
      }
        - Portfolio Exposure: ${riskMetrics.exposurePercentage.toFixed(1)}%
        - Daily P&L: ${
          riskMetrics.dailyPnLPercentage >= 0 ? "+" : ""
        }${riskMetrics.dailyPnLPercentage.toFixed(2)}%
        - Can Open New: ${riskMetrics.canOpenNewPosition ? "Yes" : "No"}`);

      if (!riskMetrics.canOpenNewPosition) {
        console.log("⚠️ Cannot open new positions - risk limit reached");
        return;
      }

      const markets = Account.markets.map((el) => el.symbol);
      const symbol_opend = positions?.map((el: Position) => el.symbol) || [];
      const schedule_ordens = await OrderController.getAllOrdersSchedule(
        symbol_opend
      );
      const markets_schedule = schedule_ordens.map((el) => el.symbol);
      const markets_available = markets.filter(
        (symbol) =>
          !symbol_opend.includes(symbol) && !markets_schedule.includes(symbol)
      );

      // Cancel old scheduled orders
      for (const schedule_orden of schedule_ordens) {
        if (schedule_orden.minutes > 5) {
          await Order.cancelOpenOrders(schedule_orden.symbol || "");
        }
      }

      const LIMIT_ORDER = parseInt(process.env.LIMIT_ORDER || "1");

      if (
        (positions?.length || 0) <= LIMIT_ORDER &&
        schedule_ordens.length <= LIMIT_ORDER
      ) {
        console.log("Markets available: ", markets_available.length);

        for (const market of markets_available) {
          const candles = await Markets.getCandles5m(market, 25);
          if (!candles || candles.length === 0) continue;

          const ticker = await Markets.getTicker(market);
          if (!ticker) continue;

          const marketPrice = parseFloat(
            ticker.lastPrice || ticker.markPrice || "0"
          );
          if (marketPrice === 0) continue;

          // Find market data
          const marketData = Account.markets.find((m) => m.symbol === market);
          if (!marketData) continue;

          // Convert AccountController market format to Market interface
          const fullMarketData: Market = {
            symbol: marketData.symbol,
            baseSymbol: marketData.symbol.split("-")[0] || marketData.symbol,
            quoteSymbol: marketData.symbol.split("-")[1] || "USD",
            decimal_price: marketData.decimal_price,
            decimal_quantity: marketData.decimal_quantity,
            minOrderSize: Account.minVolumeDollar,
            tickSize: Math.pow(10, -marketData.decimal_price),
            marketType: "PERP",
            orderBookState: "Open",
          };

          // Create AccountData for strategy with converted markets
          const accountData: AccountData = {
            capitalAvailable: Account.capitalAvailable,
            leverage: Account.leverage,
            maxOpenOrders: Account.maxOpenOrders || 5,
            minVolumeDollar: Account.minVolumeDollar,
            markets: Account.markets.map((m) => ({
              symbol: m.symbol,
              baseSymbol: m.symbol.split("-")[0] || m.symbol,
              quoteSymbol: m.symbol.split("-")[1] || "USD",
              decimal_price: m.decimal_price,
              decimal_quantity: m.decimal_quantity,
              minOrderSize: Account.minVolumeDollar,
              tickSize: Math.pow(10, -m.decimal_price),
              marketType: "PERP",
              orderBookState: "Open",
            })),
          };

          // Get positions for this symbol
          const openPositionsForSymbol =
            positions?.filter((p) => p.symbol === market) || [];

          // Ensure strategy is initialized
          if (!this.currentStrategy) {
            console.log("⚠️ Strategy not initialized, skipping analysis");
            continue;
          }

          // Use the current strategy to analyze
          const strategyResult = await this.currentStrategy.analyze(
            candles,
            fullMarketData,
            accountData,
            openPositionsForSymbol,
            positions || []
          );

          if (!strategyResult || strategyResult.action === "NEUTRAL") {
            console.log(
              `😴 ${market}: ${strategyResult?.reason || "No signal"}`
            );
            continue;
          }

          console.log(
            `🎯 ${market}: ${strategyResult.action} signal - ${strategyResult.reason}`
          );

          // Convert strategy result to legacy format for OrderController
          const dataset: AnalysisResult = {
            action: strategyResult.action,
            entry: strategyResult.entry || marketPrice,
            marketPrice: strategyResult.marketPrice,
            volume: strategyResult.volume || Account.minVolumeDollar,
            market: market,
            stop: strategyResult.stopLoss || null,
            target:
              strategyResult.takeProfit1 || strategyResult.takeProfit || null,
          };

          // Calculate safe position size using risk manager if not provided by strategy
          if (!strategyResult.volume) {
            const stopLoss =
              strategyResult.stopLoss ||
              marketPrice * (strategyResult.action === "LONG" ? 0.95 : 1.05);
            const safeVolume = this.riskManager.calculateSafePositionSize(
              marketPrice,
              stopLoss,
              Account.capitalAvailable,
              parseFloat(process.env.MAX_RISK_PER_TRADE || "0.02")
            );
            dataset.volume = Math.max(safeVolume, Account.minVolumeDollar);
          }

          // VALIDATE POSITION WITH RISK MANAGER
          const validation = await this.riskManager.validateNewPosition(
            market,
            dataset.volume!,
            dataset.entry!,
            dataset.stop || null,
            Account.capitalAvailable,
            positions || [],
            Account.leverage
          );

          if (!validation.isValid) {
            console.log(
              `❌ Position rejected for ${market}: ${validation.reason}`
            );

            if (
              validation.suggestedVolume &&
              validation.suggestedVolume > Account.minVolumeDollar
            ) {
              console.log(
                `💡 Using suggested volume: $${validation.suggestedVolume.toFixed(
                  2
                )}`
              );
              dataset.volume = validation.suggestedVolume;

              // Re-validate with suggested volume
              const revalidation = await this.riskManager.validateNewPosition(
                market,
                dataset.volume,
                dataset.entry!,
                dataset.stop || null,
                Account.capitalAvailable,
                positions || [],
                Account.leverage
              );

              if (!revalidation.isValid) {
                console.log(`❌ Re-validation failed: ${revalidation.reason}`);
                continue; // Skip this trade
              }
            } else {
              continue; // Skip this trade
            }
          } else {
            console.log(
              `✅ Position validated for ${market} - Risk: ${validation.riskPercentage?.toFixed(
                2
              )}%`
            );
          }

          const orders = await OrderController.getRecentOpenOrders(market);

          if (orders.length > 0) {
            if (orders[0]!.minutes > 10) {
              await Order.cancelOpenOrders(market);
              await OrderController.openOrder(dataset as any);
            } else {
              await OrderController.openOrder(dataset as any);
            }
          } else {
            await OrderController.openOrder(dataset as any);
          }
        }
      }
      console.log("done");
    } catch (error) {
      console.log("analyze Error", error);
    }
  }

  analyzeMAEMACross(
    candles: Candle[],
    marketPrice: number | string,
    period: number = 21,
    entryOffset: number = 0.0005
  ): AnalysisResult {
    const closes = candles.map((c) => parseFloat(c.close));
    const ma: (number | null)[] = [];
    const ema: (number | null)[] = [];
    const k = 2 / (period + 1);

    // Cálculo da MA
    for (let i = 0; i < closes.length; i++) {
      if (i + 1 >= period) {
        const sum = closes
          .slice(i + 1 - period, i + 1)
          .reduce((a, b) => a + b, 0);
        ma.push(sum / period);
      } else {
        ma.push(null);
      }
    }

    // Cálculo da EMA
    for (let i = 0; i < closes.length; i++) {
      if (i === period - 1) {
        const maValue = ma[i];
        ema.push(maValue !== null && maValue !== undefined ? maValue : null);
      } else if (i >= period) {
        ema.push(closes[i]! * k + ema[i - 1]! * (1 - k));
      } else {
        ema.push(null);
      }
    }

    const i = closes.length - 1;
    const iPrev = i - 1;
    const parsedMarketPrice = parseFloat(marketPrice.toString());

    let action: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
    let entry: number | null = null;

    if (
      ma[iPrev] !== null &&
      ema[iPrev] !== null &&
      ma[i] !== null &&
      ema[i] !== null
    ) {
      // Your WORKING JavaScript version
      const prevDiff = ma[iPrev]! - ema[iPrev]!; // SMA - EMA (SLOW - FAST)
      const currDiff = ma[i]! - ema[i]!;

      // SMA crosses ABOVE EMA → LONG (trend confirmation)
      if (prevDiff <= 0 && currDiff > 0) {
        action = "LONG";
        entry = parseFloat((parsedMarketPrice - entryOffset).toFixed(6));
      }

      // SMA crosses BELOW EMA → SHORT (trend confirmation)
      else if (prevDiff >= 0 && currDiff < 0) {
        action = "SHORT";
        entry = parseFloat((parsedMarketPrice + entryOffset).toFixed(6));
      }
    }

    return {
      action,
      entry,
      marketPrice: parsedMarketPrice,
    };
  }

  findSupportResistance(
    candles: Candle[],
    entryPrice: number
  ): SupportResistance {
    const supports: number[] = [];
    const resistances: number[] = [];

    for (let i = 1; i < candles.length - 1; i++) {
      const prev = candles[i - 1]!;
      const curr = candles[i]!;
      const next = candles[i + 1]!;

      const low = parseFloat(curr.low);
      const high = parseFloat(curr.high);

      // Suporte: fundo local
      if (low < parseFloat(prev.low) && low < parseFloat(next.low)) {
        supports.push(low);
      }

      // Resistência: topo local
      if (high > parseFloat(prev.high) && high > parseFloat(next.high)) {
        resistances.push(high);
      }
    }

    // Encontrar suporte mais próximo abaixo do preço de entrada
    const support =
      supports.filter((level) => level < entryPrice).sort((a, b) => b - a)[0] ??
      null;

    // Encontrar resistência mais próxima acima do preço de entrada
    const resistance =
      resistances
        .filter((level) => level > entryPrice)
        .sort((a, b) => a - b)[0] ?? null;

    return {
      stopLoss: support,
      takeProfit: resistance,
    };
  }

  /**
   * Update P&L when a position is closed
   */
  updateTradeResult(pnl: number): void {
    this.riskManager.updateDailyPnL(pnl);
  }

  /**
   * Get current risk metrics
   */
  async getCurrentRiskMetrics(): Promise<any> {
    const positions = await Futures.getOpenPositions();
    const account = await AccountController.get();
    return this.riskManager.getRiskMetrics(
      positions || [],
      account.capitalAvailable
    );
  }

  /**
   * Get risk manager instance for external use
   */
  getRiskManager(): RiskManager {
    return this.riskManager;
  }
}

export default new Decision();
