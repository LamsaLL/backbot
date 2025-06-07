import { Candle, Position, Market } from "../types/index.js";

export interface AnalysisResult {
  action: "LONG" | "SHORT" | "NEUTRAL";
  symbol: string;
  marketPrice: number;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  takeProfit1?: number; // For partial TP1
  takeProfit2?: number; // For partial TP2 (potentially with trailing)
  volume?: number;
  partialClosePct?: number; // Percentage of position to close at TP1 (e.g., 40 for 40%)
  trailingStopParams?: {
    // For TP2's trailing stop
    atrValue?: number;
    trailMultiplier?: number;
    trailOffsetPoints?: number;
  };
  reason?: string; // For logging the decision
}

export interface StrategyConfig {
  [key: string]: any; // General purpose for various strategy parameters
}

export interface AccountData {
  capitalAvailable: number;
  leverage: number;
  maxOpenOrders: number;
  minVolumeDollar: number;
  markets: Market[];
}

export interface IStrategy {
  readonly name: string;

  /**
   * Initializes the strategy with its specific configuration.
   */
  initialize(config: StrategyConfig): Promise<void>;

  /**
   * Analyzes market data and decides on a trading action.
   */
  analyze(
    candles: Candle[],
    market: Market,
    account: AccountData,
    openPositionsForSymbol: Position[],
    allOpenPositions: Position[]
  ): Promise<AnalysisResult | null>;
}
