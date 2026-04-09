import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useApp } from '../context';

const { width, height } = Dimensions.get('window');

type WindowType = 'morning' | 'night';
type ScreenMode = 'list' | 'countdown';

interface AlternativeActivity {
  icon: string;
  name: string;
  description: string;
  isCustom?: boolean;
}

const MORNING_ACTIVITIES: AlternativeActivity[] = [
  { icon: 'body-outline', name: '晨间拉伸', description: '先活动身体，把注意力从屏幕拉回身体感觉。' },
  { icon: 'water-outline', name: '冷水洗脸', description: '用温度变化唤醒大脑，比刷消息更自然。' },
  { icon: 'create-outline', name: '记录今日目标', description: '只写今天最重要的 1-3 件事，减少分心。' },
  { icon: 'cafe-outline', name: '喝一杯温水', description: '先补水，再进入一天的节奏。' },
  { icon: 'walk-outline', name: '窗边远眺', description: '给眼睛和大脑一点远距离、低刺激的过渡。' },
  { icon: 'create-outline', name: '其他', description: '输入你自己的晨间低刺激替代活动。', isCustom: true },
];

const NIGHT_ACTIVITIES: AlternativeActivity[] = [
  { icon: 'book-outline', name: '阅读纸质书', description: '用平稳节奏代替刷屏，把大脑慢慢降下来。' },
  { icon: 'leaf-outline', name: '冥想放松', description: '把注意力收回呼吸和身体，降低兴奋度。' },
  { icon: 'checkmark-done-outline', name: '今日复盘', description: '简单回顾一天，别再额外打开信息流。' },
  { icon: 'moon-outline', name: '温水泡脚', description: '给身体一个明确的睡前信号。' },
  { icon: 'bed-outline', name: '整理床铺', description: '先把睡眠环境收拾好，再进入夜间节奏。' },
  { icon: 'create-outline', name: '其他', description: '输入你自己的睡前低刺激替代活动。', isCustom: true },
];

export default function LowStimScreen() {
  const { state, completeLowStimWindow } = useApp();
  const { userData, todayTasks } = state;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode] = useState<ScreenMode>('list');
  const [windowType, setWindowType] = useState<WindowType>('morning');
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1小时
  const [selectedMorningActivityIndex, setSelectedMorningActivityIndex] = useState(0);
  const [selectedNightActivityIndex, setSelectedNightActivityIndex] = useState(0);
  const [customMorningActivity, setCustomMorningActivity] = useState('');
  const [customNightActivity, setCustomNightActivity] = useState('');
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

  // 动画
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const rotateLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 动画效果
  useEffect(() => {
    if (mode === 'countdown') {
      // 脉冲动画
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();

      // 旋转动画
      rotateLoopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 60000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoopRef.current.start();

      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      // 倒计时
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        pulseLoopRef.current?.stop();
        rotateLoopRef.current?.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        pulseAnim.setValue(1);
        rotateAnim.setValue(0);
      };
    }
  }, [mode, windowType]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWithinWindow = (start: string, end: string) => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const isMorningWindow = () => {
    return isWithinWindow(
      userData?.settings.morningWindowStart || '06:00',
      userData?.settings.morningWindowEnd || '07:00'
    );
  };

  const isNightWindow = () => {
    return isWithinWindow(
      userData?.settings.nightWindowStart || '22:00',
      userData?.settings.nightWindowEnd || '23:00'
    );
  };

  const startCountdown = (type: WindowType) => {
    if (type === 'morning' && todayTasks.morningWindow) return;
    if (type === 'night' && todayTasks.nightWindow) return;

    const selectedIndex = type === 'morning'
      ? selectedMorningActivityIndex
      : selectedNightActivityIndex;

    setWindowType(type);
    setTimeLeft(60 * 60); // 1小时
    setCurrentActivityIndex(selectedIndex);
    setMode('countdown');
  };

  const cancelCountdown = () => {
    setMode('list');
    setTimeLeft(60 * 60);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleComplete = () => {
    completeLowStimWindow(windowType);
    setMode('list');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const activities = windowType === 'morning' ? MORNING_ACTIVITIES : NIGHT_ACTIVITIES;
  const selectedMorningActivity = MORNING_ACTIVITIES[selectedMorningActivityIndex];
  const selectedNightActivity = NIGHT_ACTIVITIES[selectedNightActivityIndex];
  const resolveActivity = (
    activity: AlternativeActivity,
    customText: string,
    fallbackDescription: string
  ) => {
    if (!activity.isCustom) {
      return activity;
    }

    const trimmedText = customText.trim();
    return {
      ...activity,
      name: trimmedText || '自定义活动',
      description: trimmedText
        ? `把注意力放在“${trimmedText}”这件低刺激小事上，稳定度过这一段时间。`
        : fallbackDescription,
    };
  };

  const resolvedMorningActivity = resolveActivity(
    selectedMorningActivity,
    customMorningActivity,
    '填写一个你愿意在晨间替代刷手机的小活动，例如整理桌面、写待办或拉伸。'
  );
  const resolvedNightActivity = resolveActivity(
    selectedNightActivity,
    customNightActivity,
    '填写一个你愿意在睡前替代刷屏的小活动，例如整理书包、读书或做拉伸。'
  );
  const currentActivity = resolveActivity(
    activities[currentActivityIndex] || activities[0],
    windowType === 'morning' ? customMorningActivity : customNightActivity,
    windowType === 'morning'
      ? '把晨间的注意力放回低刺激活动上。'
      : '把睡前的注意力放回安静、平稳的活动上。'
  );
  const isMorningCustomSelected = selectedMorningActivity.isCustom === true;
  const isNightCustomSelected = selectedNightActivity.isCustom === true;
  const canStartMorning = !todayTasks.morningWindow && (!isMorningCustomSelected || customMorningActivity.trim().length > 0);
  const canStartNight = !todayTasks.nightWindow && (!isNightCustomSelected || customNightActivity.trim().length > 0);

  // 列表视图
  if (mode === 'list') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 当前时间 */}
          <View style={styles.timeCard}>
            <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
            <Text style={styles.dateText}>
              {currentTime.toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </Text>
          </View>

          {/* 连续天数 */}
          <View style={styles.streakCard}>
            <Ionicons name="flame" size={24} color={Colors.warning} />
            <Text style={styles.streakText}>
              已连续 <Text style={styles.streakNumber}>{userData?.stats.currentStreak || 0}</Text> 天
            </Text>
          </View>

          {/* 低刺激窗口卡片 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>低刺激窗口</Text>

            {/* 早晨窗口 */}
            <View
              style={[
                styles.windowCard,
                isMorningWindow() && styles.windowCardActive,
                todayTasks.morningWindow && styles.windowCardComplete
              ]}
            >
              <View style={styles.windowHeader}>
                <View style={styles.windowTitleRow}>
                  <Ionicons
                    name="sunny"
                    size={24}
                    color={todayTasks.morningWindow ? Colors.success : Colors.primary}
                  />
                  <Text style={styles.windowTitle}>早晨窗口</Text>
                </View>
                {todayTasks.morningWindow ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                ) : (
                  <Ionicons name="play-circle" size={24} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.windowTime}>
                {userData?.settings.morningWindowStart || '06:00'} - {userData?.settings.morningWindowEnd || '07:00'}
              </Text>
              <Text style={styles.windowDesc}>
                起床后1小时远离电子屏幕，让大脑自然唤醒
              </Text>
              <View style={styles.alternatives}>
                <Text style={styles.alternativesTitle}>自己选一个替代活动：</Text>
                <View style={styles.alternativesList}>
                  {MORNING_ACTIVITIES.map((activity, index) => (
                    <TouchableOpacity
                      key={activity.name}
                      style={[
                        styles.alternativeItem,
                        index === selectedMorningActivityIndex && styles.alternativeItemSelected,
                      ]}
                      onPress={() => setSelectedMorningActivityIndex(index)}
                    >
                      <Ionicons
                        name={activity.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={index === selectedMorningActivityIndex ? Colors.primaryDark : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.alternativeText,
                          index === selectedMorningActivityIndex && styles.alternativeTextSelected,
                        ]}
                      >
                        {activity.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {isMorningCustomSelected && (
                  <TextInput
                    style={styles.customActivityInput}
                    value={customMorningActivity}
                    onChangeText={setCustomMorningActivity}
                    placeholder="输入你的晨间替代活动"
                    placeholderTextColor={Colors.textMuted}
                  />
                )}
                <View style={styles.selectedActivityCard}>
                  <Text style={styles.selectedActivityLabel}>当前选择：{resolvedMorningActivity.name}</Text>
                  <Text style={styles.selectedActivityDesc}>{resolvedMorningActivity.description}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.windowActionButton,
                  todayTasks.morningWindow && styles.windowActionButtonDone,
                  !canStartMorning && !todayTasks.morningWindow && styles.windowActionButtonDisabled,
                ]}
                onPress={() => startCountdown('morning')}
                disabled={!canStartMorning}
              >
                <Ionicons
                  name={todayTasks.morningWindow ? 'checkmark-circle' : 'play-circle'}
                  size={18}
                  color={todayTasks.morningWindow ? Colors.success : Colors.card}
                />
                <Text
                  style={[
                    styles.windowActionButtonText,
                    todayTasks.morningWindow && styles.windowActionButtonTextDone,
                  ]}
                >
                  {todayTasks.morningWindow ? '今天已完成' : isMorningCustomSelected && !customMorningActivity.trim() ? '先填写活动' : '用这个活动开始'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 晚间窗口 */}
            <View
              style={[
                styles.windowCard,
                isNightWindow() && styles.windowCardActive,
                todayTasks.nightWindow && styles.windowCardComplete
              ]}
            >
              <View style={styles.windowHeader}>
                <View style={styles.windowTitleRow}>
                  <Ionicons
                    name="moon"
                    size={24}
                    color={todayTasks.nightWindow ? Colors.success : Colors.accent}
                  />
                  <Text style={styles.windowTitle}>睡前窗口</Text>
                </View>
                {todayTasks.nightWindow ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                ) : (
                  <Ionicons name="play-circle" size={24} color={Colors.accent} />
                )}
              </View>
              <Text style={styles.windowTime}>
                {userData?.settings.nightWindowStart || '22:00'} - {userData?.settings.nightWindowEnd || '23:00'}
              </Text>
              <Text style={styles.windowDesc}>
                睡前1小时远离屏幕，保护褪黑素分泌，提升睡眠质量
              </Text>
              <View style={styles.alternatives}>
                <Text style={styles.alternativesTitle}>自己选一个替代活动：</Text>
                <View style={styles.alternativesList}>
                  {NIGHT_ACTIVITIES.map((activity, index) => (
                    <TouchableOpacity
                      key={activity.name}
                      style={[
                        styles.alternativeItem,
                        index === selectedNightActivityIndex && styles.alternativeItemSelected,
                      ]}
                      onPress={() => setSelectedNightActivityIndex(index)}
                    >
                      <Ionicons
                        name={activity.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={index === selectedNightActivityIndex ? Colors.accent : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.alternativeText,
                          index === selectedNightActivityIndex && styles.alternativeTextSelected,
                        ]}
                      >
                        {activity.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {isNightCustomSelected && (
                  <TextInput
                    style={styles.customActivityInput}
                    value={customNightActivity}
                    onChangeText={setCustomNightActivity}
                    placeholder="输入你的睡前替代活动"
                    placeholderTextColor={Colors.textMuted}
                  />
                )}
                <View style={styles.selectedActivityCard}>
                  <Text style={styles.selectedActivityLabel}>当前选择：{resolvedNightActivity.name}</Text>
                  <Text style={styles.selectedActivityDesc}>{resolvedNightActivity.description}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.windowActionButton,
                  styles.nightActionButton,
                  todayTasks.nightWindow && styles.windowActionButtonDone,
                  !canStartNight && !todayTasks.nightWindow && styles.windowActionButtonDisabled,
                ]}
                onPress={() => startCountdown('night')}
                disabled={!canStartNight}
              >
                <Ionicons
                  name={todayTasks.nightWindow ? 'checkmark-circle' : 'play-circle'}
                  size={18}
                  color={todayTasks.nightWindow ? Colors.success : Colors.card}
                />
                <Text
                  style={[
                    styles.windowActionButtonText,
                    todayTasks.nightWindow && styles.windowActionButtonTextDone,
                  ]}
                >
                  {todayTasks.nightWindow ? '今天已完成' : isNightCustomSelected && !customNightActivity.trim() ? '先填写活动' : '用这个活动开始'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 原理说明 */}
          <View style={styles.principleCard}>
            <Ionicons name="bulb" size={20} color={Colors.warning} />
            <Text style={styles.principleText}>
              低刺激窗口帮助降低大脑的多巴胺基准线，让你对无聊和枯燥的耐受度逐渐提高，从而更容易进入深度专注状态。
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 倒计时视图
  return (
    <View style={styles.countdownContainer}>
      <StatusBar barStyle="dark-content" />

      {/* 背景动画圆环 */}
      <Animated.View
        style={[
          styles.bgCircle,
          { transform: [{ scale: pulseAnim }, { rotate: spin }] }
        ]}
      />

      {/* 主内容 */}
      <View style={styles.countdownContent}>
        <Text style={styles.countdownTitle}>
          {windowType === 'morning' ? '早晨窗口' : '睡前窗口'}
        </Text>

        {/* 倒计时圆环 */}
        <View style={styles.timerWrapper}>
          <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.timerText}>{formatCountdown(timeLeft)}</Text>
            <Text style={styles.timerLabel}>剩余时间</Text>
          </Animated.View>
        </View>

        {/* 当前推荐活动 */}
        <Animated.View style={[styles.activityCard, { opacity: fadeAnim }]}>
          <View style={styles.activityIconWrapper}>
            <Ionicons
              name={currentActivity.icon as keyof typeof Ionicons.glyphMap}
              size={32}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.activityName}>{currentActivity.name}</Text>
          <Text style={styles.activityHint}>
            {currentActivity.description}
          </Text>
        </Animated.View>

        {/* 提示 */}
        <View style={styles.tipsCard}>
          <Ionicons name="phone-portrait-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.tipsText}>请放下手机，专注于当前活动</Text>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelCountdown}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
            <Text style={styles.cancelButtonText}>放弃</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Ionicons name="checkmark" size={20} color={Colors.card} />
            <Text style={styles.completeButtonText}>提前完成</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  timeCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 20,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.text,
    letterSpacing: 2,
  },
  dateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 24,
  },
  streakText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.warning,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  windowCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  windowCardActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  windowCardComplete: {
    borderColor: Colors.success,
    opacity: 0.7,
  },
  windowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  windowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  windowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  windowTime: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  windowDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  alternatives: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
  },
  alternativesTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  alternativesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  alternativeItemSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  alternativeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  alternativeTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  selectedActivityCard: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
  },
  customActivityInput: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  selectedActivityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedActivityDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  windowActionButton: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  nightActionButton: {
    backgroundColor: Colors.accent,
  },
  windowActionButtonDone: {
    backgroundColor: Colors.success + '18',
  },
  windowActionButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.55,
  },
  windowActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.card,
    marginLeft: 8,
  },
  windowActionButtonTextDone: {
    color: Colors.success,
  },
  principleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  principleText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginLeft: 12,
  },

  // 倒计时样式
  countdownContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  countdownContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 40,
  },
  timerWrapper: {
    marginBottom: 40,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.text,
  },
  timerLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  activityCard: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    maxWidth: 280,
  },
  activityIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  activityName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  activityHint: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.card,
    marginLeft: 8,
  },
});
