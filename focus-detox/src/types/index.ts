// 用户数据类型
export interface UserData {
  id: string;
  createdAt: Date;
  settings: UserSettings;
  stats: UserStats;
}

export interface UserSettings {
  morningWindowStart: string; // e.g., "06:00"
  morningWindowEnd: string;   // e.g., "07:00"
  nightWindowStart: string;   // e.g., "22:00"
  nightWindowEnd: string;     // e.g., "23:00"
  boredomTrainingDuration: number; // minutes
}

export interface UserStats {
  totalBoredomMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lowStimWindowCompletions: LowStimCompletion[];
  boredomSessions: BoredomSession[];
  examResets: ExamReset[];
}

// 低刺激窗口完成记录
export interface LowStimCompletion {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'morning' | 'night';
  completed: boolean;
  completedAt?: Date;
}

// 枯燥练习记录
export interface BoredomSession {
  id: string;
  date: string;
  duration: number; // seconds
  type: 'focus' | 'breathing' | 'copying';
  beforeFocusScore?: number; // 1-5
  afterFocusScore?: number;  // 1-5
}

// 考试微刺激记录
export interface ExamReset {
  id: string;
  date: string;
  resetCount: number;
  clarityScore?: number; // 1-5
  notes?: string;
}

// 成就类型
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  requirement: {
    type: 'streak' | 'totalMinutes' | 'totalSessions';
    value: number;
  };
}

// 导航类型
export type RootTabParamList = {
  Home: undefined;
  LowStim: undefined;
  Training: undefined;
  ExamReset: undefined;
  Profile: undefined;
};
