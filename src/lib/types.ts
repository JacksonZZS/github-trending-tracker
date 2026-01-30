export interface TrendingRepo {
  id: string;
  repo_name: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  language_color: string | null;
  stars: number;
  stars_today: number;
  forks: number;
  trending_date: string;
  rank: number;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  repo_name: string;
  repo_url: string;
  notes: string | null;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  wechat_webhook_url: string | null;
  wechat_enabled: boolean;
  languages: string[];
  min_stars: number;
  notify_time: string;
  created_at: string;
  updated_at: string;
}
