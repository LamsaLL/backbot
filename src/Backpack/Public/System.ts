import axios from "axios";

interface SystemStatus {
  status: "online" | "offline" | "maintenance";
  timestamp: number;
  version?: string;
}

interface PingResponse {
  message: string;
  timestamp: number;
}

interface SystemTime {
  serverTime: number;
}

class System {
  async getStatus(): Promise<SystemStatus | null> {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/status`);
      return response.data;
    } catch (error: any) {
      console.error(
        "getStatus - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getPing(): Promise<PingResponse | null> {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/ping`);
      return response.data;
    } catch (error: any) {
      console.error("getPing - ERROR!", error.response?.data || error.message);
      return null;
    }
  }

  async getSystemTime(): Promise<SystemTime | null> {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/time`);
      return response.data;
    } catch (error: any) {
      console.error(
        "getSystemTime - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new System();
