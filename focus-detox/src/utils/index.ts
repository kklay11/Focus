// 通用工具函数 —— 全应用唯一的纯函数工具集合

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 格式化时长 (秒 -> MM:SS)
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化日期 (Date -> YYYY-MM-DD)
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

// 获取问候语
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
};

// 计算连续天数：要求最近一次记录在今天或昨天，再向前累计连续天数
export const calculateStreak = (completions: { date: string }[]): number => {
  if (completions.length === 0) return 0;

  const today = getTodayString();
  const sortedDates = [...new Set(completions.map((c) => c.date))].sort().reverse();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // 最近一次记录既不是今天也不是昨天，连胜中断
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
