import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ACHIEVEMENTS, DEFAULT_SETTINGS } from '../constants';
import { useApp } from '../context';
import { UserSettings } from '../types';
import { clearAllData } from '../utils/storage';

type DetailView = 'time' | 'reminder' | 'guide' | 'about' | null;

const MORNING_WINDOWS = [
  { label: '06:00 - 07:00', start: '06:00', end: '07:00' },
  { label: '07:00 - 08:00', start: '07:00', end: '08:00' },
  { label: '08:00 - 09:00', start: '08:00', end: '09:00' },
];

const NIGHT_WINDOWS = [
  { label: '21:30 - 22:30', start: '21:30', end: '22:30' },
  { label: '22:00 - 23:00', start: '22:00', end: '23:00' },
  { label: '22:30 - 23:30', start: '22:30', end: '23:30' },
];

const TRAINING_DURATIONS = [5, 7, 10];

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseStoredDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function ProfileScreen() {
  const { state, updateSettings } = useApp();
  const { userData } = state;

  const [detailView, setDetailView] = useState<DetailView>(null);
  const [draftSettings, setDraftSettings] = useState<UserSettings>(
    userData?.settings || DEFAULT_SETTINGS
  );

  const settings = userData?.settings || DEFAULT_SETTINGS;
  const timeSummary = `${settings.morningWindowStart}-${settings.morningWindowEnd} / ${settings.nightWindowStart}-${settings.nightWindowEnd}`;

  const weekData = useMemo(() => {
    if (!userData) return { lowStimDays: 0, trainingMinutes: 0, resetCount: 0 };

    const today = new Date();
    const weekStart = new Date(today);
    const weekday = today.getDay() || 7;
    weekStart.setDate(today.getDate() - weekday + 1);
    weekStart.setHours(0, 0, 0, 0);

    const lowStimDays = new Set(
      userData.stats.lowStimWindowCompletions
        .filter((completion) => parseStoredDate(completion.date) >= weekStart && completion.completed)
        .map((completion) => completion.date)
    ).size;

    const trainingMinutes = userData.stats.boredomSessions
      .filter((session) => parseStoredDate(session.date) >= weekStart)
      .reduce((sum, session) => sum + Math.floor(session.duration / 60), 0);

    const resetCount = userData.stats.examResets
      .filter((reset) => parseStoredDate(reset.date) >= weekStart)
      .length;

    return { lowStimDays, trainingMinutes, resetCount };
  }, [userData]);

  const unlockedAchievements = useMemo(() => {
    if (!userData) return new Set<string>();

    const unlocked = new Set<string>();
    const stats = userData.stats;

    ACHIEVEMENTS.forEach((achievement) => {
      const { type, value } = achievement.requirement;
      let isUnlocked = false;

      switch (type) {
        case 'streak':
          isUnlocked = stats.currentStreak >= value;
          break;
        case 'totalMinutes':
          isUnlocked = stats.totalBoredomMinutes >= value;
          break;
        case 'totalSessions':
          isUnlocked = stats.boredomSessions.length >= value;
          break;
      }

      if (isUnlocked) {
        unlocked.add(achievement.id);
      }
    });

    return unlocked;
  }, [userData]);

  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const weekday = today.getDay() || 7;

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - weekday + 1 + i);
      const dateStr = formatLocalDate(date);

      const completions =
        userData?.stats.lowStimWindowCompletions.filter(
          (completion) => completion.date === dateStr && completion.completed
        ) || [];

      days.push({
        label: ['一', '二', '三', '四', '五', '六', '日'][i],
        hasMorning: completions.some((completion) => completion.type === 'morning'),
        hasNight: completions.some((completion) => completion.type === 'night'),
        isToday: dateStr === formatLocalDate(today),
      });
    }

    return days;
  }, [userData]);

  const userLevel = useMemo(() => {
    const minutes = userData?.stats.totalBoredomMinutes || 0;
    const streak = userData?.stats.currentStreak || 0;
    const score = minutes + streak * 10;

    if (score < 50) return { level: 1, title: '初学者', nextScore: 50 };
    if (score < 150) return { level: 2, title: '学徒', nextScore: 150 };
    if (score < 400) return { level: 3, title: '专注者', nextScore: 400 };
    if (score < 800) return { level: 4, title: '达人', nextScore: 800 };
    return { level: 5, title: '大师', nextScore: null };
  }, [userData]);

  const progress = useMemo(() => {
    const minutes = userData?.stats.totalBoredomMinutes || 0;
    const streak = userData?.stats.currentStreak || 0;
    const score = minutes + streak * 10;
    const prevThreshold =
      userLevel.level === 1 ? 0 :
      userLevel.level === 2 ? 50 :
      userLevel.level === 3 ? 150 :
      userLevel.level === 4 ? 400 : 800;
    const nextThreshold = userLevel.nextScore || 1000;

    return ((score - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
  }, [userData, userLevel]);

  const handleClearData = () => {
    Alert.alert(
      '清除所有数据',
      '确定要清除所有数据吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('已清除', '所有数据已清除，请重启应用');
          },
        },
      ]
    );
  };

  const openDetail = (view: Exclude<DetailView, null>) => {
    if (view === 'time') {
      setDraftSettings({ ...(userData?.settings || DEFAULT_SETTINGS) });
    }
    setDetailView(view);
  };

  const closeDetail = () => {
    setDetailView(null);
  };

  const saveTimeSettings = () => {
    updateSettings(draftSettings);
    setDetailView(null);
  };

  const renderInfoCard = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    tint: string
  ) => (
    <View style={styles.infoCard} key={title}>
      <View style={[styles.infoIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
      </View>
    </View>
  );

  const renderDetailContent = () => {
    if (detailView === 'time') {
      return (
        <>
          <Text style={styles.detailTitle}>时间设置</Text>
          <Text style={styles.detailSubtitle}>这些设置会同步影响首页推荐、低刺激窗口和训练默认时长。</Text>

          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>晨间低刺激窗口</Text>
            <View style={styles.optionWrap}>
              {MORNING_WINDOWS.map((window) => {
                const selected =
                  draftSettings.morningWindowStart === window.start &&
                  draftSettings.morningWindowEnd === window.end;

                return (
                  <TouchableOpacity
                    key={window.label}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() =>
                      setDraftSettings((current) => ({
                        ...current,
                        morningWindowStart: window.start,
                        morningWindowEnd: window.end,
                      }))
                    }
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                      {window.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>夜间低刺激窗口</Text>
            <View style={styles.optionWrap}>
              {NIGHT_WINDOWS.map((window) => {
                const selected =
                  draftSettings.nightWindowStart === window.start &&
                  draftSettings.nightWindowEnd === window.end;

                return (
                  <TouchableOpacity
                    key={window.label}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() =>
                      setDraftSettings((current) => ({
                        ...current,
                        nightWindowStart: window.start,
                        nightWindowEnd: window.end,
                      }))
                    }
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                      {window.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>默认练习时长</Text>
            <View style={styles.optionWrap}>
              {TRAINING_DURATIONS.map((duration) => {
                const selected = draftSettings.boredomTrainingDuration === duration;

                return (
                  <TouchableOpacity
                    key={duration}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() =>
                      setDraftSettings((current) => ({
                        ...current,
                        boredomTrainingDuration: duration,
                      }))
                    }
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                      {duration} 分钟
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.detailTipCard}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
            <Text style={styles.detailTipText}>如果最近总是起不来或睡前拖延，优先把窗口时间调到你最容易坚持的时段。</Text>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity style={styles.secondaryAction} onPress={closeDetail}>
              <Text style={styles.secondaryActionText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryAction} onPress={saveTimeSettings}>
              <Text style={styles.primaryActionText}>保存设置</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (detailView === 'reminder') {
      return (
        <>
          <Text style={styles.detailTitle}>提醒节奏</Text>
          <Text style={styles.detailSubtitle}>先把一天里的注意力节点记住，比密集提醒更容易长期坚持。</Text>

          {renderInfoCard('sunny-outline', '早晨先降刺激', '起床后的第一小时优先做晨间低刺激，不要让信息流直接接管大脑。', Colors.primary)}
          {renderInfoCard('fitness-outline', '白天补一轮练习', '午后容易走神时，插入一次 5-10 分钟练习，比硬撑更有效。', Colors.success)}
          {renderInfoCard('moon-outline', '晚上提前收束', '21:00 之后开始减少高刺激内容，给夜间窗口留出缓冲区。', Colors.accent)}
          {renderInfoCard('flash-outline', '卡住时先拉回状态', '出现脑雾、发空、思路断掉时，用轻刺激把注意力重新拉回当下。', Colors.warning)}

          <TouchableOpacity style={styles.singleAction} onPress={closeDetail}>
            <Text style={styles.primaryActionText}>知道了</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (detailView === 'guide') {
      return (
        <>
          <Text style={styles.detailTitle}>训练指南</Text>
          <Text style={styles.detailSubtitle}>按你当下的状态选入口，不必每次都从同一个模块开始。</Text>

          {renderInfoCard('moon-outline', '低刺激窗口', '适合晨起、睡前或感觉自己被信息推着走的时候，用来整体降刺激。', Colors.primary)}
          {renderInfoCard('leaf-outline', '枯燥练习', '适合白天做一轮短训练，专门练对无聊、单调和停顿的耐受。', Colors.success)}
          {renderInfoCard('flash-outline', '快速找回状态', '适合突然脑雾、卡住、分心或发懵时，先把状态拉回来再继续。', Colors.accent)}
          {renderInfoCard('bar-chart-outline', '查看周节奏', '每周记录更能看出趋势，不要只盯着某一次表现。', Colors.warning)}

          <TouchableOpacity style={styles.singleAction} onPress={closeDetail}>
            <Text style={styles.primaryActionText}>我知道怎么用了</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={styles.detailTitle}>关于 Focus Detox</Text>
        <Text style={styles.detailSubtitle}>这不是追求“更拼”，而是帮你重新建立对低刺激和深度专注的耐受。</Text>

        {renderInfoCard('sparkles-outline', '核心目标', '降低被高刺激内容牵引的惯性，让大脑重新习惯平稳而清晰的节奏。', Colors.primary)}
        {renderInfoCard('flame-outline', '关键能力', '能承受一点无聊、停顿和延迟满足，是恢复深度专注的重要基础。', Colors.success)}
        {renderInfoCard('heart-outline', '使用方式', '把它当成每天的节奏辅助，不是额外负担；先做到稳定，再追求更长时间。', Colors.accent)}

        <TouchableOpacity style={styles.singleAction} onPress={closeDetail}>
          <Text style={styles.primaryActionText}>关闭</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>我的节奏</Text>
          <Text style={styles.pageSubtitle}>把设置和反馈调成更适合你坚持的样子</Text>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{userLevel.level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>{userLevel.title}</Text>
              <Text style={styles.levelSubtitle}>
                {userLevel.nextScore
                  ? `距离下一级还需 ${userLevel.nextScore - (userData?.stats.totalBoredomMinutes || 0) - (userData?.stats.currentStreak || 0) * 10} 分`
                  : '已达到最高等级'}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={22} color={Colors.warning} />
            <Text style={styles.statValue}>{userData?.stats.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>连续天数</Text>
            <Text style={styles.statSubLabel}>最高 {userData?.stats.longestStreak || 0} 天</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color={Colors.primary} />
            <Text style={styles.statValue}>{userData?.stats.totalBoredomMinutes || 0}</Text>
            <Text style={styles.statLabel}>累计分钟</Text>
            <Text style={styles.statSubLabel}>{userData?.stats.boredomSessions.length || 0} 次练习</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>本周记录</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekDays}>
              {weekDays.map((day, index) => (
                <View key={index} style={styles.weekDay}>
                  <Text style={[styles.weekDayLabel, day.isToday && styles.weekDayLabelToday]}>{day.label}</Text>
                  <View style={styles.weekDayDots}>
                    <View
                      style={[
                        styles.weekDayDot,
                        day.hasMorning && styles.weekDayDotActive,
                        day.isToday && !day.hasMorning && styles.weekDayDotToday,
                      ]}
                    />
                    <View
                      style={[
                        styles.weekDayDot,
                        day.hasNight && styles.weekDayDotActive,
                        day.isToday && !day.hasNight && styles.weekDayDotToday,
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.weekStats}>
              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatValue}>{weekData.lowStimDays}/7</Text>
                <Text style={styles.weekStatLabel}>完成天数</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatValue}>{weekData.trainingMinutes}</Text>
                <Text style={styles.weekStatLabel}>练习分钟</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatValue}>{weekData.resetCount}</Text>
                <Text style={styles.weekStatLabel}>状态拉回</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>成就</Text>
            <Text style={styles.sectionCount}>{unlockedAchievements.size}/{ACHIEVEMENTS.length}</Text>
          </View>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedAchievements.has(achievement.id);
              return (
                <TouchableOpacity
                  key={achievement.id}
                  style={[styles.achievementCard, isUnlocked && styles.achievementCardUnlocked]}
                  onPress={() =>
                    Alert.alert(
                      achievement.title,
                      isUnlocked ? `已解锁\n${achievement.description}` : `解锁条件：${achievement.description}`
                    )
                  }
                >
                  <View style={[styles.achievementIcon, isUnlocked && styles.achievementIconUnlocked]}>
                    <Ionicons
                      name={(achievement.icon as keyof typeof Ionicons.glyphMap) || 'star-outline'}
                      size={24}
                      color={isUnlocked ? Colors.warning : Colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.achievementTitle, isUnlocked && styles.achievementTitleUnlocked]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDesc} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                  {isUnlocked && (
                    <View style={styles.unlockedBadge}>
                      <Ionicons name="checkmark" size={12} color={Colors.card} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置</Text>

          <TouchableOpacity style={[styles.settingItem, styles.settingItemStack]} onPress={() => openDetail('time')}>
            <View style={styles.settingItemTop}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="time-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingText}>时间设置</Text>
                  <Text style={styles.settingHint}>{settings.boredomTrainingDuration} 分钟训练 / 自定义早晚窗口</Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            </View>
            <View style={styles.settingSummaryChip}>
              <Text style={styles.settingSummaryText}>{timeSummary}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openDetail('reminder')}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.accentLight }]}>
                <Ionicons name="notifications-outline" size={18} color={Colors.accent} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingText}>提醒节奏</Text>
                <Text style={styles.settingHint}>按一天中的注意力节点安排提醒感</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openDetail('guide')}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#E9F6EF' }]}>
                <Ionicons name="compass-outline" size={18} color={Colors.success} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingText}>训练指南</Text>
                <Text style={styles.settingHint}>按状态选入口，不用每次都硬扛</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openDetail('about')}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFF2E5' }]}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingText}>关于 Focus Detox</Text>
                <Text style={styles.settingHint}>了解产品目标和使用方式</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFE9E9' }]}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingText, { color: Colors.error }]}>清除所有数据</Text>
                <Text style={styles.settingHint}>删除本地记录并重新开始</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Focus Detox v1.0.0</Text>
      </ScrollView>

      <Modal visible={detailView !== null} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View style={styles.detailHandle} />
              <TouchableOpacity style={styles.detailClose} onPress={closeDetail}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
              {renderDetailContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pageHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  levelCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.card,
  },
  levelInfo: {
    marginLeft: 16,
    flex: 1,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statSubLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  weekCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weekDay: {
    alignItems: 'center',
  },
  weekDayLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  weekDayLabelToday: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  weekDayDots: {
    flexDirection: 'row',
    gap: 4,
  },
  weekDayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.backgroundLight,
  },
  weekDayDotActive: {
    backgroundColor: Colors.success,
  },
  weekDayDotToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  weekStats: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  weekStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.backgroundLight,
  },
  weekStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  weekStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    opacity: 0.7,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderColor: Colors.warning + '50',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  achievementIconUnlocked: {
    backgroundColor: '#FFF2E5',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementTitleUnlocked: {
    color: Colors.text,
  },
  achievementDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  settingItemStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  settingItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  settingHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  settingSummaryChip: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingSummaryText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
  },
  dangerItem: {
    marginTop: 12,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(29, 41, 57, 0.28)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
  },
  detailHeader: {
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  detailHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundLight,
    marginBottom: 8,
  },
  detailClose: {
    position: 'absolute',
    right: 20,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  detailSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  detailBlock: {
    marginBottom: 20,
  },
  detailBlockTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.cardLight,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  optionChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  optionChipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  detailTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.cardLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  detailTipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginLeft: 10,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: Colors.cardLight,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.card,
  },
  singleAction: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.cardLight,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
