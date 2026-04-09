// 颜色主题 - 明亮、柔和、舒适的日间氛围
export const Colors = {
  // 主色调
  primary: '#6F8FF7',
  primaryLight: '#DCE6FF',
  primaryDark: '#5674D8',
  
  // 强调色
  accent: '#8F7CF7',
  accentLight: '#EFE9FF',
  
  // 功能色
  success: '#55B98D',
  warning: '#F2A65A',
  error: '#E36D6D',
  
  // 背景色
  background: '#F6F8FC',
  backgroundLight: '#E5ECF6',
  card: '#FFFFFF',
  cardLight: '#F2F6FB',
  
  // 文字色
  text: '#1F3147',
  textSecondary: '#5F7085',
  textMuted: '#8A99AD',
  
  // 渐变
  gradient: {
    primary: ['#DCE6FF', '#EEF3FF', '#FFFFFF'],
    accent: ['#EFE9FF', '#F7F2FF'],
    success: ['#DDF6EA', '#F3FBF7'],
    dark: ['#F6F8FC', '#F2F6FB', '#FFFFFF'],
  },
};

// 默认设置
export const DEFAULT_SETTINGS: import('../types').UserSettings = {
  morningWindowStart: '06:00',
  morningWindowEnd: '07:00',
  nightWindowStart: '22:00',
  nightWindowEnd: '23:00',
  boredomTrainingDuration: 5, // 5分钟
};

// 枯燥练习类型
export const BOREDOM_TRAINING_TYPES = [
  {
    id: 'focus',
    name: '定点凝视',
    description: '盯着一个固定点，训练专注力',
    icon: 'eye-outline',
  },
  {
    id: 'breathing',
    name: '呼吸计数',
    description: '数呼吸，感受呼吸的节奏',
    icon: 'leaf-outline',
  },
  {
    id: 'copying',
    name: '静默抄写',
    description: '手写抄录文字，进入心流状态',
    icon: 'create-outline',
  },
] as const;

// 成就列表
export const ACHIEVEMENTS: import('../types').Achievement[] = [
  {
    id: 'first_session',
    title: '初次尝试',
    description: '完成第一次枯燥练习',
    icon: 'star',
    requirement: { type: 'totalSessions', value: 1 },
  },
  {
    id: 'streak_7',
    title: '一周坚持',
    description: '连续7天完成低刺激窗口',
    icon: 'flame',
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'streak_30',
    title: '月度达人',
    description: '连续30天完成低刺激窗口',
    icon: 'trophy',
    requirement: { type: 'streak', value: 30 },
  },
  {
    id: 'total_60min',
    title: '一小时勇士',
    description: '累计枯燥练习60分钟',
    icon: 'clock',
    requirement: { type: 'totalMinutes', value: 60 },
  },
  {
    id: 'total_300min',
    title: '专注大师',
    description: '累计枯燥练习300分钟',
    icon: 'ribbon',
    requirement: { type: 'totalMinutes', value: 300 },
  },
];

// 微刺激动作指南
export const MICRO_RESET_ACTIONS = [
  {
    id: 'tiger_mouth',
    name: '按压虎口',
    description: '用拇指和食指用力按压另一只手的虎口（合谷穴）5秒',
    duration: 5,
    caution: '力度适中，避免淤青',
    icon: 'hand-left-outline',
    scene: '适合脑雾、发懵或刚刚走神时快速拉回注意力',
    steps: [
      '找到另一只手的虎口位置',
      '用拇指和食指逐渐加压',
      '稳定按压 5 秒，留意身体反馈',
      '松开后做一次深呼吸，重新回到任务上',
    ],
  },
  {
    id: 'nail_bed',
    name: '掐指甲床',
    description: '用指甲轻轻掐压另一只手的指甲床5秒',
    duration: 5,
    caution: '力度以感到轻微疼痛为宜',
    icon: 'flash-outline',
    scene: '适合注意力突然下坠、需要短时唤醒时使用',
    steps: [
      '选择一根手指的指甲床位置',
      '用另一只手轻掐 5 秒',
      '感受短促而清晰的刺激',
      '放松手部，马上回到眼前任务',
    ],
  },
  {
    id: 'cold_water',
    name: '冷水刺激',
    description: '用冷水洗脸或手腕，快速唤醒大脑',
    duration: 10,
    caution: '外出前可提前准备冷水或湿巾，避免临时手忙脚乱',
    icon: 'water-outline',
    scene: '适合午后迟钝、久坐疲惫或切换状态时使用',
    steps: [
      '准备冷水或靠近水龙头',
      '用冷水冲洗手腕或轻拍面部',
      '感受温度变化带来的清醒感',
      '擦干后重新进入下一段专注',
    ],
  },
  {
    id: 'pinch_ear',
    name: '揉捏耳垂',
    description: '用力揉捏耳垂，刺激神经末梢',
    duration: 8,
    caution: '力度适中，避免拉伤',
    icon: 'ear-outline',
    scene: '适合卡住、发空或准备重新起步时快速唤醒',
    steps: [
      '用拇指和食指捏住耳垂',
      '均匀揉捏 8 秒左右',
      '感受耳部逐渐变热',
      '停下后把注意力重新压回当前任务',
    ],
  },
];

// 动画时长
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};
