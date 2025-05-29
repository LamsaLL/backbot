// Market and Trading Types
export interface Market {
  symbol: string;
  baseSymbol: string;
  quoteSymbol: string;
  decimal_price: number;
  decimal_quantity: number;
  minOrderSize: number;
  tickSize: number;
  marketType?: string;
  orderBookState?: string;
}

export interface Position {
  symbol: string;
  netQuantity: string;
  side: "Long" | "Short";
  unrealizedPnl: string;
  notionalValue: string;
  markPrice: string;
  entryPrice: string;
  netCost?: string;
  userId?: string;
  positionId?: string;
  breakEvenPrice?: string;
}

export interface Balance {
  symbol: string;
  available: string;
  locked: string;
  staked: string;
}

export interface Account {
  leverageLimit: number;
  balance: Balance[];
  positions?: Position[];
  markets?: Market[];
  futuresMakerFee?: string;
}

// Order Types
export interface OrderData {
  symbol: string;
  orderType: "Market" | "Limit";
  side: "Bid" | "Ask";
  quantity: string;
  price?: string;
  triggerPrice?: string;
  triggerQuantity?: string;
  triggerBy?: "LastPrice" | "MarkPrice";
  stopLossTriggerPrice?: string;
  stopLossLimitPrice?: string;
  stopLossTriggerBy?: "LastPrice" | "MarkPrice";
  takeProfitTriggerPrice?: string;
  takeProfitLimitPrice?: string;
  takeProfitTriggerBy?: "LastPrice" | "MarkPrice";
  clientId?: number;
  timeInForce?: "GTC" | "IOC" | "FOK";
  postOnly?: boolean;
  reduceOnly?: boolean;
  autoLend?: boolean;
  autoLendRedeem?: boolean;
  autoBorrow?: boolean;
  autoBorrowRepay?: boolean;
  selfTradePrevention?: "RejectTaker" | "RejectMaker";
}

export interface Order {
  id: string;
  symbol: string;
  side: "Bid" | "Ask";
  orderType: "Market" | "Limit";
  quantity: string;
  price?: string;
  triggerPrice?: string;
  status: "New" | "Filled" | "Cancelled" | "PartiallyFilled";
  createdAt: string;
  updatedAt: string;
}

// Candlestick Data
export interface Candle {
  symbol: string;
  interval: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  timestamp: number;
}

// Authentication
export interface AuthParams {
  instruction: string;
  timestamp: number;
  params: Record<string, any>;
  window?: number;
}

export interface AuthHeaders {
  "X-Timestamp": string;
  "X-API-Key": string;
  "X-Signature": string;
  "X-Window"?: string;
  "Content-Type": string;
  [key: string]: string | undefined;
}

// Trading Strategy Types
export interface TradeSignal {
  action: "LONG" | "SHORT" | "HOLD";
  entry: number;
  stop: number;
  target: number;
  volume: number;
  market: string;
}

export interface TrailingStopData {
  symbol: string;
  price: number;
  isLong: boolean;
  quantity: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  orderId?: string;
}

// Utility Types
export type Side = "Bid" | "Ask";
export type OrderType = "Market" | "Limit";
export type TimeInForce = "GTC" | "IOC" | "FOK";
export type TriggerBy = "LastPrice" | "MarkPrice";

// Environment Variables
export interface EnvConfig {
  PRIVATE_KEY: string;
  PUBLIC_KEY: string;
  API_URL: string;
  LIMIT_ORDER: string;
  SIMULATION_MODE: string;
}

// Additional API Types for converted modules
export interface Asset {
  symbol: string;
  name: string;
  decimals: number;
  isCollateral: boolean;
  maxLeverage?: number;
  borrowRate?: string;
  lendRate?: string;
}

export interface Collateral {
  symbol: string;
  haircut: string;
  maxLeverage: number;
  isActive: boolean;
}

export interface BorrowLendMarket {
  symbol: string;
  borrowRate: string;
  lendRate: string;
  minQuantity: string;
  maxQuantity: string;
  available: string;
  utilized: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: string;
  price: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface SystemStatus {
  status: "online" | "offline" | "maintenance";
  timestamp: number;
  version?: string;
}

export interface BorrowLendPosition {
  symbol: string;
  side: "Borrow" | "Lend";
  quantity: string;
  rate?: string;
  maturity?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  type: string;
  amount: string;
}
