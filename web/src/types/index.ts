import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  groupId: string | null;
  active: boolean;
  activeSessionId: string | null;
  totalPoints: number;
  totalStudySeconds: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  levelId: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  timezone: string;
  ownerId: string;
  memberCount: number;
  activeSeasonId: string | null;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface GroupMember {
  uid: string;
  groupId: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  role: 'admin' | 'member';
  joinedAt?: Timestamp | any;
  totalPoints: number;
  totalStudySeconds: number;
  weekPoints: number;
  weekStudySeconds: number;
  weekId: string; // YYYY-Www
  monthPoints: number;
  monthStudySeconds: number;
  monthId: string; // YYYY-MM
  seasonPoints: number;
  seasonStudySeconds: number;
  seasonId: string | null;
  updatedAt?: Timestamp | any;
}

export type StudySessionStatus = 'active' | 'paused' | 'completed' | 'discarded';

export interface StudySession {
  id: string;
  userId: string;
  groupId: string;
  studyDate: string; // YYYY-MM-DD
  status: StudySessionStatus;
  startedAt?: Timestamp | any;
  lastResumedAt?: Timestamp | null | any;
  pausedAt?: Timestamp | null | any;
  endedAt?: Timestamp | null | any;
  accumulatedSeconds: number;
  totalSeconds: number;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface ActiveSessionState {
  hasActiveSession: boolean;
  session: StudySession | null;
  currentElapsedSeconds: number;
}

export interface FinishSessionResult {
  sessionId: string;
  studyDate: string;
  sessionSeconds: number;
  dailyTotalSeconds: number;
  pointEarnedNow: boolean;
  totalPoints: number;
  currentStreak: number;
  newBadgesCount: number;
}

export interface DailyStudy {
  id: string; // YYYY-MM-DD
  userId: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  totalSessions: number;
  sessionsCount?: number;
  pointEarned: boolean;
  pointEarnedAt?: Timestamp | null | any;
  updatedAt?: Timestamp | any;
}

export interface Season {
  status?: 'draft' | 'active' | 'closed';
  podium?: { rank: number; uid: string; name: string; nickname: string; avatarUrl: string | null; points: number; studySeconds: number }[];
  id: string;
  groupId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  active: boolean;
  createdAt?: Timestamp | any;
}

export interface LevelConfig {
  id: string;
  name: string;
  requiredSeconds: number;
  order: number;
  icon: string;
}

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  ruleType: 'first_point' | 'streak' | 'total_hours' | 'total_points' | 'rank_first';
  requirement: number;
  active: boolean;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Timestamp | any;
}

export type FeedEventType = 
  | 'season_closed'
  | 'point_earned' 
  | 'streak_milestone' 
  | 'badge_unlocked' 
  | 'hours_milestone' 
  | 'manual_post';

export interface FeedPost {
  id: string;
  groupId: string;
  userId: string;
  userNickname: string;
  userAvatarUrl: string | null;
  type: FeedEventType;
  title: string;
  message: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  authorNickname?: string;
  authorAvatarUrl?: string | null;
  metadata?: Record<string, any>;
  likeCount: number;
  commentCount: number;
  likesCount?: number;
  commentsCount?: number;
  isLikedByMe?: boolean;
  createdAt?: Timestamp | any;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  userNickname: string;
  userAvatarUrl: string | null;
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface FeedLikeUser {
  uid: string;
  name?: string;
  nickname: string;
  avatarUrl: string | null;
}

export type RankingPeriod = 'week' | 'month' | 'season' | 'all' | 'hours';

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  points: number;
  studySeconds: number;
  studyHours: number;
  levelName: string;
  currentStreak: number;
}

export interface LeaderboardResponse {
  period: RankingPeriod;
  groupId: string;
  totalMembers: number;
  entries: LeaderboardEntry[];
}

// Alias for LeaderboardResponse
export type LeaderboardResult = LeaderboardResponse;

export interface UserStatsSummary {
  totalHours: number;
  totalMinutes: number;
  totalStudySeconds: number;
  totalDaysStudied: number;
  dailyAverageSeconds: number;
  dailyAverageMinutes: number;
  maxDaySeconds: number;
  maxDayMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  seasonPoints: number;
  level: {
    currentLevel: LevelConfig;
    nextLevel: LevelConfig | null;
    currentSeconds: number;
    requiredSecondsForNext: number;
    progressPercentage: number;
  };
}

export interface TimeSeriesPoint {
  date: string;
  dateStr?: string;
  studySeconds: number;
  studyHours: number;
  hours?: number;
  pointEarned: boolean;
}

export interface UserStatsResponse {
  summary: UserStatsSummary;
  timeSeries: {
    last7Days: TimeSeriesPoint[];
    last30Days: TimeSeriesPoint[];
  };
}

// Alias for UserStatsResponse
export type UserStatsResult = UserStatsResponse;

export interface RegisterUserResult {
  uid: string;
  name: string;
  nickname: string;
  token?: string;
}
