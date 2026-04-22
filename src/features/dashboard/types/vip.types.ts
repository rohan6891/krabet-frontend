export type VipProfileResponse = {
  success: boolean;
  data: {
    profile: {
      user_id: string;
      level_id: string;
      level_name: string;
      total_wager: string;
      monthly_wager: string;
      required_wager: string;
      rakeback_percent: string;
      cashback_percent: string;
      bonus_multiplier: string;
      next_level_name: string | null;
      next_level_required_wager: string | null;
      progress_percent: number;
    };
  };
};

export type VipLevelsResponse = {
  success: boolean;
  data: {
    levels: Array<{
      id: string;
      name: string;
      required_wager: string;
      rakeback_percent: string;
      cashback_percent: string;
      bonus_multiplier: string;
    }>;
  };
};
