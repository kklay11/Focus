import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, MICRO_RESET_ACTIONS } from '../constants';
import { useApp } from '../context';
import { getTodayString } from '../utils/storage';

const { width } = Dimensions.get('window');

type ScreenMode = 'list' | 'guide';

type MicroAction = (typeof MICRO_RESET_ACTIONS)[number];

export default function ExamResetScreen() {
  const { state, addExamReset, getTodayStats } = useApp();
  const { userData } = state;

  const [mode, setMode] = useState<ScreenMode>('list');
  const [activeAction, setActiveAction] = useState<MicroAction | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [clarityScore, setClarityScore] = useState<number>(3);
  const [notes, setNotes] = useState('');

  // 倒计时状态
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  // 动画
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const todayStats = getTodayStats();

  useEffect(() => {
    if (isCountingDown) {
      // 脉冲动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 进度动画
      const totalDuration = activeAction?.duration || 5;
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: totalDuration * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      // 倒计时
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCountingDown(false);
            setShowComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        pulseAnim.setValue(1);
        progressAnim.setValue(0);
      };
    }
  }, [isCountingDown, activeAction]);

  useEffect(() => {
    if (mode === 'guide' && activeAction) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [mode, activeAction]);

  const startGuide = (action: MicroAction) => {
    setActiveAction(action);
    setMode('guide');
  };

  const startCountdown = () => {
    if (!activeAction) return;
    setCountdown(activeAction.duration);
    setIsCountingDown(true);
    setShowComplete(false);
  };

  const cancelGuide = () => {
    setIsCountingDown(false);
    setCountdown(0);
    setShowComplete(false);
    setMode('list');
    setActiveAction(null);
    progressAnim.setValue(0);
  };

  const completeGuide = () => {
    setShowComplete(false);
    setMode('list');
    setActiveAction(null);
    setShowRecordModal(true);
  };

  const handleRecord = () => {
    addExamReset({
      resetCount: 1,
      clarityScore: clarityScore,
      notes: notes.trim() || undefined,
    });
    setShowRecordModal(false);
    setClarityScore(3);
    setNotes('');
  };

  const recentResets = userData?.stats.examResets
    .filter(r => r.date === getTodayString())
    .slice(-3) || [];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // 列表视图
  if (mode === 'list') {
    return (
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>快速找回状态</Text>
          <Text style={styles.subtitle}>
              脑雾、分心或突然卡住时，用轻微刺激把状态迅速拉回来
          </Text>
        </View>

          {/* 今日统计 */}
          <View style={styles.todayStats}>
            <View style={styles.todayStatItem}>
              <Text style={styles.todayStatValue}>{todayStats.resetCount}</Text>
              <Text style={styles.todayStatLabel}>今日找回</Text>
            </View>
            <View style={styles.todayStatItem}>
              <Text style={styles.todayStatValue}>{userData?.stats.examResets.length || 0}</Text>
              <Text style={styles.todayStatLabel}>累计记录</Text>
            </View>
          </View>

          {/* 原理说明 */}
          {showTutorial && (
            <View style={styles.principleCard}>
              <View style={styles.principleHeader}>
                <Ionicons name="bulb" size={20} color={Colors.warning} />
                <Text style={styles.principleTitle}>为什么它能帮你拉回状态</Text>
              </View>
              <Text style={styles.principleText}>
                轻微而短暂的刺激能打断昏沉和游离感，帮助你重新感知身体、呼吸和手头任务，让注意力更快回到当下。
              </Text>
              <TouchableOpacity onPress={() => setShowTutorial(false)}>
                <Text style={styles.hideText}>收起说明</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 微刺激动作 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>选择一种快速拉回方式</Text>
            {MICRO_RESET_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => startGuide(action)}
              >
                <View style={styles.actionCardContent}>
                  <View style={[styles.actionIcon, { backgroundColor: action.id === 'cold_water' ? '#E4F4FF' : Colors.primaryLight }]}>
                    <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={24} color={action.id === 'cold_water' ? Colors.primaryDark : Colors.primary} />
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionName}>{action.name}</Text>
                    <Text style={styles.actionScene}>{action.scene}</Text>
                    <Text style={styles.actionDuration}>{action.duration} 秒轻刺激</Text>
                  </View>
                  <Ionicons name="play-circle" size={28} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 场景预演 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>高压场景预演</Text>
            <View style={styles.prepCard}>
              <View style={styles.prepItem}>
                <View style={styles.prepNumber}>
                  <Text style={styles.prepNumberText}>1</Text>
                </View>
                <Text style={styles.prepText}>在模拟学习、会议或高压任务里先试一遍</Text>
              </View>
              <View style={styles.prepItem}>
                <View style={styles.prepNumber}>
                  <Text style={styles.prepNumberText}>2</Text>
                </View>
                <Text style={styles.prepText}>找到适合自己的力度、时长和触发时机</Text>
              </View>
              <View style={styles.prepItem}>
                <View style={styles.prepNumber}>
                  <Text style={styles.prepNumberText}>3</Text>
                </View>
                <Text style={styles.prepText}>真正卡住时，能更自然地把状态拉回来</Text>
              </View>
            </View>
          </View>

          {/* 最近记录 */}
          {recentResets.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>今日找回记录</Text>
              {recentResets.map((reset, index) => (
                <View key={reset.id} style={styles.recordItem}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordTime}>
                      第 {recentResets.length - index} 次找回
                    </Text>
                    {reset.clarityScore && (
                      <View style={styles.recordScore}>
                        <Text style={styles.recordScoreText}>清醒度 {reset.clarityScore}/5</Text>
                      </View>
                    )}
                  </View>
                  {reset.notes && <Text style={styles.recordNotes}>{reset.notes}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* 注意事项 */}
          <View style={styles.warningCard}>
            <Ionicons name="medical" size={20} color={Colors.error} />
            <Text style={styles.warningText}>
              只做轻量刺激即可，不要追求强烈疼痛。如果出现明显不适，请立即停止并咨询专业医生。
            </Text>
          </View>

          {/* 记录按钮 */}
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => setShowRecordModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.text} />
            <Text style={styles.recordBtnText}>手动记录一次</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 记录弹窗 */}
        <Modal
          visible={showRecordModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRecordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>记录找回状态</Text>

              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>清醒度评分</Text>
                <View style={styles.scoreOptions}>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <TouchableOpacity
                      key={score}
                      style={[
                        styles.scoreBtn,
                        clarityScore === score && styles.scoreBtnSelected,
                      ]}
                      onPress={() => setClarityScore(score)}
                    >
                      <Text style={[
                        styles.scoreBtnText,
                        clarityScore === score && styles.scoreBtnTextSelected,
                      ]}>
                        {score}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.scoreLabels}>
                  <Text style={styles.scoreLabelSmall}>无效</Text>
                  <Text style={styles.scoreLabelSmall}>很清醒</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setShowRecordModal(false)}
                >
                  <Text style={styles.cancelModalBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveModalBtn}
                  onPress={handleRecord}
                >
                  <Text style={styles.saveModalBtnText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // 引导视图
  return (
    <View style={styles.guideContainer}>
      <StatusBar barStyle="dark-content" />

      {/* 返回按钮 */}
      <TouchableOpacity style={styles.guideBackBtn} onPress={cancelGuide}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
        <Text style={styles.guideBackText}>返回</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.guideContent, { opacity: fadeAnim }]}>
        <Text style={styles.guideTitle}>{activeAction?.name}</Text>
        <Text style={styles.guideDesc}>{activeAction?.description}</Text>

        {/* 倒计时/完成区域 */}
        <View style={styles.countdownArea}>
          {!isCountingDown && !showComplete ? (
            // 开始前 - 显示步骤
            <View style={styles.stepsContainer}>
              {activeAction?.steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          ) : isCountingDown ? (
            // 倒计时中
            <View style={styles.countdownWrapper}>
              <Animated.View style={[styles.countdownCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownLabel}>秒</Text>
              </Animated.View>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.countdownHint}>保持力度，专注感受</Text>
            </View>
          ) : (
            // 完成
            <View style={styles.completeWrapper}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              <Text style={styles.completeText}>动作完成</Text>
                <Text style={styles.completeHint}>
                  留意呼吸、视线和思路是否更稳定，然后立刻回到当前任务
                </Text>
            </View>
          )}
        </View>

        {/* 注意事项 */}
        <View style={styles.cautionCard}>
          <Ionicons name="warning" size={18} color={Colors.warning} />
          <Text style={styles.cautionText}>{activeAction?.caution}</Text>
        </View>

        {/* 操作按钮 */}
        <View style={styles.guideActions}>
          {!isCountingDown && !showComplete && (
            <TouchableOpacity style={styles.startActionBtn} onPress={startCountdown}>
              <Ionicons name="play" size={20} color={Colors.card} />
              <Text style={styles.startActionBtnText}>开始计时</Text>
            </TouchableOpacity>
          )}
          {showComplete && (
            <>
              <TouchableOpacity style={styles.redoBtn} onPress={() => {
                setShowComplete(false);
                setIsCountingDown(true);
                setCountdown(activeAction?.duration || 5);
                progressAnim.setValue(0);
              }}>
                <Ionicons name="refresh" size={18} color={Colors.textMuted} />
                <Text style={styles.redoBtnText}>再做一次</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeBtn} onPress={completeGuide}>
                <Text style={styles.completeBtnText}>完成并记录</Text>
              </TouchableOpacity>
            </>
          )}
          {isCountingDown && (
            <TouchableOpacity style={styles.cancelCountdownBtn} onPress={() => {
              setIsCountingDown(false);
              progressAnim.setValue(0);
            }}>
              <Text style={styles.cancelCountdownBtnText}>取消</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  todayStats: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  todayStatItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  todayStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  todayStatLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  principleCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  principleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  principleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  principleText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  hideText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'right',
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
  actionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  actionName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  actionScene: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  actionDuration: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  prepCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  prepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  prepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.card,
  },
  prepText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  recordItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  recordScore: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordScoreText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  recordNotes: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 13,
    color: Colors.error,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  recordBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreSection: {
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  scoreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnSelected: {
    backgroundColor: Colors.primary,
  },
  scoreBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scoreBtnTextSelected: {
    color: Colors.card,
  },
  scoreLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  scoreLabelSmall: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveModalBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.card,
  },

  // 引导视图样式
  guideContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  guideBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  guideBackText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
  },
  guideContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  guideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  guideDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  countdownArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.card,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  countdownWrapper: {
    alignItems: 'center',
  },
  countdownCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
    marginBottom: 32,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '200',
    color: Colors.text,
  },
  countdownLabel: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: Colors.card,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  countdownHint: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  completeWrapper: {
    alignItems: 'center',
  },
  completeText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  completeHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cautionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  cautionText: {
    fontSize: 13,
    color: Colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  guideActions: {
    width: '100%',
    gap: 12,
  },
  startActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  startActionBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.card,
    marginLeft: 8,
  },
  redoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 14,
  },
  redoBtnText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  completeBtn: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.card,
  },
  cancelCountdownBtn: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelCountdownBtnText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
});
