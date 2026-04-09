import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, UserStats } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const STORAGE_KEYS = {
  USER_DATA: '@focus_detox_user_data',
  SETTINGS: '@focus_detox_settings',
  STATS: '@focus_detox_stats',
};

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 格式化时长
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化日期
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取今天的日期字符串
export const getTodayString = (): string => {
  return formatDate(new Date());
};

// 导出存储键
export { STORAGE_KEYS };

// 解析用户数据并确保类型正确
const parseUserData = (jsonString: string): UserData | null => {
  try {
    const data = JSON.parse(jsonString);

    data.settings = {
      ...DEFAULT_SETTINGS,
      ...data.settings,
    };

    data.stats = {
      totalBoredomMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      lowStimWindowCompletions: [],
      boredomSessions: [],
      examResets: [],
      ...data.stats,
    };
    
    // 确保所有布尔字段都是布尔类型
    if (data.stats) {
      if (data.stats.lowStimWindowCompletions) {
        data.stats.lowStimWindowCompletions = data.stats.lowStimWindowCompletions.map(
          (c: any) => ({
            ...c,
            completed: c.completed === true || c.completed === 'true',
          })
        );
      }
    }
    
    // 确保 createdAt 是 Date 对象
    if (typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    
    return data;
  } catch {
    return null;
  }
};

// 初始化用户数据
export const initializeUserData = async (): Promise<UserData> => {
  const userData: UserData = {
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
  await saveUserData(userData);
  return userData;
};

// 获取或初始化用户数据
export const getOrInitUserData = async (): Promise<UserData> => {
  try {
    const existingData = await loadUserData();
    if (existingData) {
      return existingData;
    }
    return initializeUserData();
  } catch (error) {
    console.error('Error in getOrInitUserData:', error);
    // 返回默认数据，不阻塞应用
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
  }
};

// 保存用户数据
export const saveUserData = async (data: UserData): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, jsonValue);
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

// 加载用户数据
export const loadUserData = async (): Promise<UserData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (data) {
      return parseUserData(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

// 更新部分用户数据
export const updateUserData = async (updates: Partial<UserData>): Promise<void> => {
  const currentData = await loadUserData();
  if (currentData) {
    const newData = { ...currentData, ...updates };
    await saveUserData(newData);
  }
};

// 清除所有数据
export const clearAllData = async (): Promise<void> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
