const fallbackApiBaseUrl = "http://localhost:4000";

export const env = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || fallbackApiBaseUrl).replace(/\/$/, ""),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  twitterClientId: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || "",
  twitterRedirectUri: process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI || "",
  telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "",
};
