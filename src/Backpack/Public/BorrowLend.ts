import axios from "axios";

interface BorrowLendMarket {
  symbol: string;
  borrowRate: string;
  lendRate: string;
  minQuantity: string;
  maxQuantity: string;
  available: string;
  utilized: string;
}

interface BorrowLendHistoryItem {
  timestamp: number;
  borrowRate: string;
  lendRate: string;
  available: string;
  utilized: string;
}

class BorrowLend {
  async getMarkets(): Promise<BorrowLendMarket[] | null> {
    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/borrowLend/markets`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "getMarkets - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getHistory(
    symbol: string,
    interval: string = "1d"
  ): Promise<BorrowLendHistoryItem[] | null> {
    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/borrowLend/markets/history`,
        {
          params: { symbol, interval },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "getHistory - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new BorrowLend();
