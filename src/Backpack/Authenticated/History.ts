import axios from "axios";
import { auth } from "./Authentication.js";

interface HistoryParams {
  symbol?: string;
  type?: string;
  limit?: number;
  offset?: number;
  sortDirection?: "asc" | "desc";
  positionId?: string;
  sources?: string[];
  orderId?: string;
  from?: string;
  to?: string;
  fillType?: string;
  marketType?: string | string[];
  subaccountId?: string;
  source?: string;
  side?: string;
  state?: string;
}

interface BorrowHistoryItem {
  id: string;
  symbol: string;
  type: string;
  amount: string;
  timestamp: string;
}

interface FillHistoryItem {
  id: string;
  orderId: string;
  symbol: string;
  side: string;
  quantity: string;
  price: string;
  timestamp: string;
  fee: string;
}

interface OrderHistoryItem {
  id: string;
  symbol: string;
  side: string;
  orderType: string;
  quantity: string;
  price?: string;
  status: string;
  timestamp: string;
}

interface FundingPayment {
  symbol: string;
  payment: string;
  timestamp: string;
}

interface PnlHistoryItem {
  symbol: string;
  realizedPnl: string;
  timestamp: string;
}

interface SettlementHistoryItem {
  source: string;
  amount: string;
  timestamp: string;
}

class History {
  async getBorrowHistory(
    symbol?: string,
    type?: string,
    limit?: number,
    offset?: number,
    sortDirection?: "asc" | "desc",
    positionId?: string,
    sources?: string[]
  ): Promise<BorrowHistoryItem[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (symbol) params.symbol = symbol;
    if (type) params.type = type;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (sortDirection) params.sortDirection = sortDirection;
    if (positionId) params.positionId = positionId;
    if (sources) params.sources = sources;

    const headers = auth({
      instruction: "borrowHistoryQueryAll",
      timestamp,
      params: params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/borrowLend`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getBorrowHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getInterestHistory(
    symbol?: string,
    type?: string,
    limit?: number,
    offset?: number,
    sortDirection?: "asc" | "desc",
    positionId?: string,
    sources?: string[]
  ): Promise<any[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (symbol) params.symbol = symbol;
    if (type) params.type = type;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (sortDirection) params.sortDirection = sortDirection;
    if (positionId) params.positionId = positionId;
    if (sources) params.sources = sources;

    const headers = auth({
      instruction: "interestHistoryQueryAll",
      timestamp,
      params: params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/interest`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getInterestHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getBorrowPositionHistory(
    symbol?: string,
    side?: string,
    state?: string,
    limit?: number,
    offset?: number,
    sortDirection?: "asc" | "desc"
  ): Promise<any[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (symbol) params.symbol = symbol;
    if (side) params.side = side;
    if (state) params.state = state;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (sortDirection) params.sortDirection = sortDirection;

    const headers = auth({
      instruction: "borrowPositionHistoryQueryAll",
      timestamp,
      params: params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/borrowLend/positions`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getBorrowPositionHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getFillHistory(
    symbol?: string,
    orderId?: string,
    from?: string,
    to?: string,
    limit?: number,
    offset?: number,
    fillType?: string,
    marketType?: string | string[],
    sortDirection?: "asc" | "desc"
  ): Promise<FillHistoryItem[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (orderId) params.orderId = orderId;
    if (from) params.from = from;
    if (to) params.to = to;
    if (symbol) params.symbol = symbol;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (fillType) params.fillType = fillType;
    if (marketType) params.marketType = marketType; // array if multi values
    if (sortDirection) params.sortDirection = sortDirection;

    const headers = auth({
      instruction: "fillHistoryQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/fills`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getFillHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getFundingPayments(
    symbol?: string,
    limit?: number,
    offset?: number,
    sortDirection?: "asc" | "desc"
  ): Promise<FundingPayment[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (symbol) params.symbol = symbol;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (sortDirection) params.sortDirection = sortDirection;

    const headers = auth({
      instruction: "fundingHistoryQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/funding`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getFundingPayments - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getOrderHistory(
    orderId?: string,
    symbol?: string,
    limit?: number,
    offset?: number,
    marketType?: string,
    sortDirection?: "asc" | "desc"
  ): Promise<OrderHistoryItem[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (orderId) params.orderId = orderId;
    if (symbol) params.symbol = symbol;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (marketType) params.marketType = marketType;
    if (sortDirection) params.sortDirection = sortDirection;

    const headers = auth({
      instruction: "orderHistoryQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/orders`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getOrderHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getProfitAndLossHistory(
    subaccountId?: string,
    symbol?: string,
    limit?: number,
    offset?: number,
    sortDirection?: "asc" | "desc"
  ): Promise<PnlHistoryItem[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (subaccountId) params.subaccountId = subaccountId;
    if (symbol) params.symbol = symbol;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (sortDirection) params.sortDirection = sortDirection;

    const headers = auth({
      instruction: "pnlHistoryQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/pnl`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getProfitAndLossHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  //source: "BackstopLiquidation" "CulledBorrowInterest" "CulledRealizePnl" "CulledRealizePnlBookUtilization" "FundingPayment" "RealizePnl" "TradingFees" "TradingFeesSystem"
  async getSettlementHistory(
    limit?: number,
    offset?: number,
    source?: string,
    sortDirection?: "asc" | "desc"
  ): Promise<SettlementHistoryItem[] | null> {
    const timestamp = Date.now();

    const params: HistoryParams = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (source) params.source = source;
    if (sortDirection) params.sortDirection = sortDirection;

    const headers = auth({
      instruction: "settlementHistoryQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/history/settlement`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getSettlementHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new History();
