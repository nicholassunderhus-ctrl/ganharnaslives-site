export enum Platform {
  Kick = 'Kick',
  YouTube = 'YouTube',
  Twitch = 'Twitch',
}

export interface Stream {
  id: string;
  platform: Platform;
  streamer: string;
  title: string;
  category: string;
  viewers: number;
  currentViewers: number;
  maxViewers: number;
  thumbnailUrl: string;
  streamUrl: string;
  pointsPerMinute: number;
  durationMinutes: number;
  isFull: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  points: number;
  totalEarned: number;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'withdraw';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}
