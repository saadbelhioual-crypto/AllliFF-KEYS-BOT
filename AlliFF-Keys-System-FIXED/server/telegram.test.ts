import { describe, expect, it } from "vitest";
import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

describe("Telegram Bot Credentials", () => {
  it("should validate telegram bot token by fetching bot info", async () => {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    );

    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);
    expect(response.data.result).toBeDefined();
    expect(response.data.result.username).toBe("AlliFF_Store_Keysbot");
    expect(response.data.result.is_bot).toBe(true);
  });
});
