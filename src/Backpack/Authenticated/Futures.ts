import axios from "axios";
import { auth } from "./Authentication.js";
import { Position } from "../../types/index.js";

class Futures {
  async getOpenPositions(): Promise<Position[] | null> {
    const timestamp = Date.now();
    const headers = auth({
      instruction: "positionQuery",
      timestamp,
      params: {},
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/position`,
        {
          headers,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "getOpenPositions - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new Futures();
