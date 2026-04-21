export type DashboardGame = {
  id: string;
  code: string;
  name: string;
  status: boolean;
  image?: string;
  image_path?: string;
  tag?: string;
  category?: string;
  subtitle?: string;
  config?: Record<string, unknown>;
};

export type DashboardWin = {
  id: string;
  username: string;
  game_code: string;
  game_name: string;
  currency: string;
  payout: string;
  multiplier: string;
  won_at: string;
};

export type DashboardGamesResponse = {
  success: boolean;
  data: {
    games: DashboardGame[];
  };
};

export type DashboardGameCategorySummary = {
  key: "casino" | "sports" | "live" | "lottery";
  label: string;
  total: number;
};

export type DashboardGameCategoriesResponse = {
  success: boolean;
  data: {
    categories: DashboardGameCategorySummary[];
  };
};

export type DashboardCategoryGamesResponse = {
  success: boolean;
  data: {
    category: "casino" | "sports" | "live" | "lottery";
    label: string;
    total: number;
    games: DashboardGame[];
  };
};

export type DashboardWinsResponse = {
  success: boolean;
  data: {
    wins: DashboardWin[];
  };
};

export type WalletBalanceResponse = {
  success: boolean;
  data: {
    wallets: Array<{
      id: string;
      currency: string;
      balance: string;
      lockedBalance: string;
      availableBalance: string;
    }>;
  };
};

export type MeResponse = {
  success: boolean;
  data: {
    user: {
      id: string;
      username: string;
      email: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      phoneNumber?: string | null;
      phoneCountryCode?: string | null;
      country?: string | null;
      timezone?: string | null;
      preferredLanguage?: string | null;
      dateOfBirth?: string | null;
      preferredDateTime?: string | null;
    };
  };
};
