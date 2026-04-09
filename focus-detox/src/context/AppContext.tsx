import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserData, UserStats, UserSettings, LowStimCompletion, BoredomSession, ExamReset } from '../types';
import { getOrInitUserData, saveUserData, generateId, getTodayString, formatDate } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../constants';

// 状态类型
interface AppState {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  todayTasks: {
    morningWindow: boolean;
    nightWindow: boolean;
    training: boolean;
  };
}

// 操作类型
type AppAction =
  | { type: 'SET_USER_DATA'; payload: UserData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'COMPLETE_LOW_STIM_WINDOW'; payload: { type: 'morning' | 'night' } }
  | { type: 'ADD_BOREDOM_SESSION'; payload: BoredomSession }
  | { type: 'ADD_EXAM_RESET'; payload: ExamReset }
  | { type: 'UPDATE_STREAK' };

// 初始状态
const initialState: AppState = {
  userData: null,
  isLoading: true,
  error: null,
  todayTasks: {
    morningWindow: false,
    nightWindow: false,
    training: false,
  },
};

// 计算连续天数
const calculateStreak = (completions: LowStimCompletion[]): number => {
  if (completions.length === 0) return 0;

  const today = getTodayString();
  const sortedDates = [...new Set(completions.map(c => c.date))].sort().reverse();
  
  // 检查今天或昨天是否有记录
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);
  
  if (sortedDates[0] !== today && sortedDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const prev = new Date(sortedDates[i + 1]);
    const diffDays = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER_DATA': {
      const recalculatedStreak = calculateStreak(action.payload.stats.lowStimWindowCompletions);
      const normalizedUserData: UserData = {
        ...action.payload,
        stats: {
          ...action.payload.stats,
          currentStreak: recalculatedStreak,
          longestStreak: Math.max(recalculatedStreak, action.payload.stats.longestStreak),
        },
      };
      const today = getTodayString();
      const todayCompletions = normalizedUserData.stats.lowStimWindowCompletions.filter(
        c => c.date === today && c.completed
      );
      const todaySessions = normalizedUserData.stats.boredomSessions.filter(
        s => s.date === today
      );

      saveUserData(normalizedUserData);

      return {
        ...state,
        userData: normalizedUserData,
        isLoading: false,
        error: null,
        todayTasks: {
          morningWindow: todayCompletions.some(c => c.type === 'morning'),
          nightWindow: todayCompletions.some(c => c.type === 'night'),
          training: todaySessions.length > 0,
        },
      };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'UPDATE_SETTINGS': {
      if (!state.userData) return state;

      const newUserData: UserData = {
        ...state.userData,
        settings: {
          ...state.userData.settings,
          ...action.payload,
        },
      };

      saveUserData(newUserData);
      return { ...state, userData: newUserData };
    }

    case 'COMPLETE_LOW_STIM_WINDOW': {
      if (!state.userData) return state;

      const completion: LowStimCompletion = {
        id: generateId(),
        date: getTodayString(),
        type: action.payload.type,
        completed: true,
        completedAt: new Date(),
      };

      const newCompletions = [
        ...state.userData.stats.lowStimWindowCompletions.filter(
          c => !(c.date === getTodayString() && c.type === action.payload.type)
        ),
        completion,
      ];

      const newStreak = calculateStreak(newCompletions);

      const newStats: UserStats = {
        ...state.userData.stats,
        lowStimWindowCompletions: newCompletions,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, state.userData.stats.longestStreak),
      };

      const newUserData = { ...state.userData, stats: newStats };
      saveUserData(newUserData);

      return {
        ...state,
        userData: newUserData,
        todayTasks: {
          ...state.todayTasks,
          [action.payload.type === 'morning' ? 'morningWindow' : 'nightWindow']: true,
        },
      };
    }

    case 'ADD_BOREDOM_SESSION': {
      if (!state.userData) return state;

      const newStats: UserStats = {
        ...state.userData.stats,
        totalBoredomMinutes: state.userData.stats.totalBoredomMinutes + Math.floor(action.payload.duration / 60),
        boredomSessions: [...state.userData.stats.boredomSessions, action.payload],
      };

      const newUserData = { ...state.userData, stats: newStats };
      saveUserData(newUserData);

      return {
        ...state,
        userData: newUserData,
        todayTasks: { ...state.todayTasks, training: true },
      };
    }

    case 'ADD_EXAM_RESET': {
      if (!state.userData) return state;

      const newStats: UserStats = {
        ...state.userData.stats,
        examResets: [...state.userData.stats.examResets, action.payload],
      };

      const newUserData = { ...state.userData, stats: newStats };
      saveUserData(newUserData);

      return { ...state, userData: newUserData };
    }

    case 'UPDATE_STREAK': {
      if (!state.userData) return state;

      const newStreak = calculateStreak(state.userData.stats.lowStimWindowCompletions);
      const newStats: UserStats = {
        ...state.userData.stats,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, state.userData.stats.longestStreak),
      };

      const newUserData = { ...state.userData, stats: newStats };
      saveUserData(newUserData);

      const today = getTodayString();
      const todayCompletions = newUserData.stats.lowStimWindowCompletions.filter(
        c => c.date === today && c.completed
      );
      const todaySessions = newUserData.stats.boredomSessions.filter(
        s => s.date === today
      );

      return {
        ...state,
        userData: newUserData,
        todayTasks: {
          morningWindow: todayCompletions.some(c => c.type === 'morning'),
          nightWindow: todayCompletions.some(c => c.type === 'night'),
          training: todaySessions.length > 0,
        },
      };
    }

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  error: string | null;
  dispatch: React.Dispatch<AppAction>;
  updateSettings: (updates: Partial<UserSettings>) => void;
  completeLowStimWindow: (type: 'morning' | 'night') => void;
  addBoredomSession: (session: Omit<BoredomSession, 'id' | 'date'>) => void;
  addExamReset: (reset: Omit<ExamReset, 'id' | 'date'>) => void;
  getTodayStats: () => { lowStimCount: number; trainingMinutes: number; resetCount: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// 创建默认用户数据（不使用 AsyncStorage）
const createDefaultUserData = (): UserData => {
  return {
    id: generateId(),
    createdAt: new Date(),
    settings: { ...DEFAULT_SETTINGS },
    stats: {
      totalBoredomMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      lowStimWindowCompletions: [],
      boredomSessions: [],
      examResets: [],
    },
  };
};

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 初始化加载用户数据
  useEffect(() => {
    loadInitialData();
  }, []);

  // 每天凌晨重置今日任务状态
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const scheduleNextMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      timeout = setTimeout(() => {
        dispatch({ type: 'UPDATE_STREAK' });
        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    scheduleNextMidnight();

    return () => clearTimeout(timeout);
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await getOrInitUserData();
      if (userData) {
        dispatch({ type: 'SET_USER_DATA', payload: userData });
      } else {
        // 如果返回 null，使用默认数据
        dispatch({ type: 'SET_USER_DATA', payload: createDefaultUserData() });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // 存储失败时使用默认数据，不阻塞应用
      dispatch({ type: 'SET_USER_DATA', payload: createDefaultUserData() });
    }
  };

  const completeLowStimWindow = (type: 'morning' | 'night') => {
    dispatch({ type: 'COMPLETE_LOW_STIM_WINDOW', payload: { type } });
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
  };

  const addBoredomSession = (session: Omit<BoredomSession, 'id' | 'date'>) => {
    const fullSession: BoredomSession = {
      ...session,
      id: generateId(),
      date: getTodayString(),
    };
    dispatch({ type: 'ADD_BOREDOM_SESSION', payload: fullSession });
  };

  const addExamReset = (reset: Omit<ExamReset, 'id' | 'date'>) => {
    const fullReset: ExamReset = {
      ...reset,
      id: generateId(),
      date: getTodayString(),
    };
    dispatch({ type: 'ADD_EXAM_RESET', payload: fullReset });
  };

  const getTodayStats = () => {
    if (!state.userData) {
      return { lowStimCount: 0, trainingMinutes: 0, resetCount: 0 };
    }

    const today = getTodayString();
    const lowStimCount = state.userData.stats.lowStimWindowCompletions.filter(
      c => c.date === today && c.completed
    ).length;
    const trainingMinutes = state.userData.stats.boredomSessions
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
    const resetCount = state.userData.stats.examResets.filter(
      r => r.date === today
    ).length;

    return { lowStimCount, trainingMinutes, resetCount };
  };

  return (
    <AppContext.Provider
      value={{
        state,
        error: state.error,
        dispatch,
        updateSettings,
        completeLowStimWindow,
        addBoredomSession,
        addExamReset,
        getTodayStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
