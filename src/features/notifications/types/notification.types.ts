export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
  };
}
