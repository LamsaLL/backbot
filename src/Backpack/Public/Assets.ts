import axios from "axios";

interface Asset {
  symbol: string;
  name: string;
  decimals: number;
  isCollateral: boolean;
  maxLeverage?: number;
  borrowRate?: string;
  lendRate?: string;
}

interface Collateral {
  symbol: string;
  haircut: string;
  maxLeverage: number;
  isActive: boolean;
}

class Assets {
  async getAssets(): Promise<Asset[] | null> {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/assets`);
      return response.data;
    } catch (error: any) {
      console.error(
        "getAssets - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getCollateral(): Promise<Collateral[] | null> {
    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/collateral`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "getCollateral - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new Assets();
