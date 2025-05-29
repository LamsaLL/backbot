import axios from "axios";
import { auth } from "./Authentication.js";
import { ApiResponse } from "../../types/index.js";

interface BorrowLendPosition {
  symbol: string;
  side: "Borrow" | "Lend";
  quantity: string;
  rate?: string;
  maturity?: string;
}

interface BorrowLendExecuteData {
  symbol: string;
  side: "Borrow" | "Lend";
  quantity: string;
}

class BorrowLend {
  async getBorrowLendPositionQuery(): Promise<BorrowLendPosition[] | null> {
    const timestamp = Date.now();

    const headers = auth({
      instruction: "borrowLendPositionQuery",
      timestamp,
      params: {},
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/borrowLend/positions`,
        {
          headers,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getBorrowLendPositionQuery - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async borrowLendExecute(
    symbol: string,
    side: "Borrow" | "Lend",
    quantity: string
  ): Promise<ApiResponse | null> {
    const timestamp = Date.now();

    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    if (!side) {
      console.error("side required");
      return null;
    }

    if (!quantity) {
      console.error("quantity required");
      return null;
    }

    const body: BorrowLendExecuteData = {
      symbol, //symbol token "BTC" "ETH" "SOL"
      side, // "Borrow" ou "Lend"
      quantity, // string, exemplo: "0.01"
    };

    const headers = auth({
      instruction: "borrowLendExecute",
      timestamp,
      params: body,
    });

    try {
      const response = await axios.post(
        `${process.env.API_URL}/api/v1/borrowLend`,
        body,
        {
          headers,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "borrowLendExecute - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new BorrowLend();
