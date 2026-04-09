import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants';
import { useApp } from '../context';
import { RootTabParamList } from '../types';

type NavigationProp = BottomTabNavigationProp<RootTabParamList>;
type TaskRoute = keyof RootTabParamList;

interface RecommendedAction {
  route: TaskRoute;
  title: string;
  description: string;
  buttonLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  taskKey?: 'morningWindow' | 'training' | 'nightWindow';
}

interface HomeTask {
  key: 'morningWindow' | 'training' | 'nightWindow';
  title: string;
  description: string;
  done: boolean;
  route: TaskRoute;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, getTodayStats } = useApp();
  const { userData, todayTasks } = state;

  const todayStats = getTodayStats();
  const currentHour = new Date().getHours();
  const greeting = getGreeting();

  const recommendedAction = useMemo<RecommendedAction>(() => {
    if (!todayTasks.morningWindow && currentHour >= 5 && currentHour < 10) {
      return {
        route: 'LowStim',
        title: '先完成晨间低刺激',
        description: '现在最适合把刺激降下来，让大脑自然进入清醒状态。',
        buttonLabel: '开始晨间窗口',
        icon: 'sunny-outline',
        tint: Colors.primary,
        taskKey: 'morningWindow',
      };
    }

    if (!todayTasks.training && currentHour >= 10 && currentHour < 21) {
      return {
        route: 'Training',
        title: '安排一次枯燥练习',
        description: '白天做一轮 5-10 分钟训练，最适合稳住注意力耐受。',
        buttonLabel: '去练习',
        icon: 'fitness-outline',
        tint: Colors.success,
        taskKey: 'training',
      };
    }

    if (!todayTasks.nightWindow && currentHour >= 21) {
      return {
        route: 'LowStim',
        title: '准备进入夜间低刺激',
        description: '开始收束刺激输入，为更稳的睡前状态做准备。',
        buttonLabel: '开始睡前窗口',
        icon: 'moon-outline',
        tint: Colors.accent,
        taskKey: 'nightWindow',
      };
    }

    if (!todayTasks.training) {
      return {
        route: 'Training',
        title: '补一轮专注训练',
        description: '今天还没做练习，现在补上能更快找回稳定节奏。',
        buttonLabel: '开始练习',
        icon: 'leaf-outline',
        tint: Colors.success,
        taskKey: 'training',
      };
    }

    if (!todayTasks.morningWindow || !todayTasks.nightWindow) {
      return {
        route: 'LowStim',
        title: '继续完成低刺激任务',
        description: '把今天剩下的低刺激窗口补齐，连胜更稳。',
        buttonLabel: '查看低刺激窗口',
        icon: 'moon-outline',
        tint: Colors.primary,
        taskKey: todayTasks.morningWindow ? 'nightWindow' : 'morningWindow',
      };
    }

    return {
      route: 'Profile',
      title: '今天节奏不错',
      description: '核心任务已经完成，可以看看本周进展和成就变化。',
      buttonLabel: '查看我的记录',
      icon: 'sparkles-outline',
      tint: Colors.warning,
    };
  }, [currentHour, todayTasks]);

  const tasks = useMemo<HomeTask[]>(() => {
    const items: HomeTask[] = [
      {
        key: 'morningWindow',
        title: '早晨低刺激窗口',
        description: '起床后 1 小时尽量不碰屏幕',
        done: todayTasks.morningWindow,
        route: 'LowStim',
        icon: 'sunny-outline',
        tint: Colors.primary,
      },
      {
        key: 'training',
        title: '完成一次枯燥练习',
        description: '做一轮 5-10 分钟专注耐受训练',
        done: todayTasks.training,
        route: 'Training',
        icon: 'fitness-outline',
        tint: Colors.success,
      },
      {
        key: 'nightWindow',
        title: '睡前低刺激窗口',
        description: '睡前 1 小时降低刺激输入',
        done: todayTasks.nightWindow,
        route: 'LowStim',
        icon: 'moon-outline',
        tint: Colors.accent,
      },
    ];

    const priorityOrder = [
      recommendedAction.taskKey,
      currentHour >= 21 ? 'nightWindow' : currentHour >= 10 ? 'training' : 'morningWindow',
      'morningWindow',
      'training',
      'nightWindow',
    ].filter(Boolean) as Array<HomeTask['key']>;

    return [...items].sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.key);
      const bPriority = priorityOrder.indexOf(b.key);

      if (a.done !== b.done) {
        return Number(a.done) - Number(b.done);
      }

      return aPriority - bPriority;
    });
  }, [currentHour, recommendedAction.taskKey, todayTasks]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>把今天最关键的一步先做掉，后面会轻很多</Text>
        </View>

        <View style={styles.recommendCard}>
          <View style={styles.recommendTopRow}>
            <View style={[styles.recommendIcon, { backgroundColor: recommendedAction.tint + '18' }]}>
              <Ionicons name={recommendedAction.icon} size={26} color={recommendedAction.tint} />
            </View>
            <View style={styles.recommendTextWrap}>
              <Text style={styles.recommendEyebrow}>此刻推荐</Text>
              <Text style={styles.recommendTitle}>{recommendedAction.title}</Text>
              <Text style={styles.recommendDesc}>{recommendedAction.description}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.recommendButton, { backgroundColor: recommendedAction.tint }]}
            onPress={() => navigation.navigate(recommendedAction.route)}
          >
            <Text style={styles.recommendButtonText}>{recommendedAction.buttonLabel}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.card} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今日任务</Text>
            <Text style={styles.sectionHint}>先做当前最合适的一项</Text>
          </View>

          <View style={styles.taskCard}>
            {tasks.map((task, index) => {
              const isRecommended = task.key === recommendedAction.taskKey && !task.done;
              return (
                <TouchableOpacity
                  key={task.key}
                  style={[
                    styles.taskItem,
                    index !== tasks.length - 1 && styles.taskItemBorder,
                    task.done && styles.taskItemDone,
                  ]}
                  onPress={() => navigation.navigate(task.route)}
                >
                  <View style={[styles.taskIcon, { backgroundColor: task.tint + '18' }]}>
                    {task.done ? (
                      <Ionicons name="checkmark" size={18} color={Colors.success} />
                    ) : (
                      <Ionicons name={task.icon} size={18} color={task.tint} />
                    )}
                  </View>

                  <View style={styles.taskContent}>
                    <View style={styles.taskTitleRow}>
                      <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                      {isRecommended && <Text style={styles.recommendedBadge}>现在适合</Text>}
                    </View>
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  </View>

                  <Ionicons
                    name={task.done ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color={task.done ? Colors.success : Colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日概览</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.stats.currentStreak || 0}</Text>
                <Text style={styles.statLabel}>连续天数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayStats.trainingMinutes}</Text>
                <Text style={styles.statLabel}>今日练习(分)</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.stats.totalBoredomMinutes || 0}</Text>
                <Text style={styles.statLabel}>累计时长(分)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快速入口</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('LowStim')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="moon-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>低刺激窗口</Text>
              <Text style={styles.actionDesc}>早晚各一段，帮助大脑慢慢降刺激</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Training')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E9F6EF' }]}>
              <Ionicons name="fitness-outline" size={24} color={Colors.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>枯燥练习</Text>
              <Text style={styles.actionDesc}>用短时训练提升对低刺激的耐受</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ExamReset')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="flash-outline" size={24} color={Colors.accent} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>快速找回状态</Text>
              <Text style={styles.actionDesc}>卡住、脑雾或走神时，迅速拉回清醒感</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  recommendCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    shadowColor: '#A8B6CC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  recommendTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recommendIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  recommendTextWrap: {
    flex: 1,
  },
  recommendEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  recommendTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  recommendDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  recommendButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.card,
    marginRight: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  taskItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  taskItemDone: {
    opacity: 0.72,
  },
  taskIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recommendedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: Colors.backgroundLight,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
