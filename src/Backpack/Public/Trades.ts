import axios from "axios";

interface Trade {
  id: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: string;
  price: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

class Trades {
  // max limit = 1000
  async getRecentTrades(
    symbol: string,
    limit: number = 100
  ): Promise<Trade[] | null> {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/trades`, {
        params: { symbol, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getRecentTrades - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // max limit = 1000
  async getHistoricalTrades(
    symbol: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Trade[] | null> {
    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/trades/history`,
        {
          params: { symbol, limit, offset },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "getHistoricalTrades - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new Trades();
