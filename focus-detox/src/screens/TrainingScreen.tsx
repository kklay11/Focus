import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BOREDOM_TRAINING_TYPES } from '../constants';
import { useApp } from '../context';

const { width } = Dimensions.get('window');

type TrainingType = 'focus' | 'breathing' | 'copying';
type ScreenMode = 'select' | 'intro' | 'training' | 'complete';

const TRAINING_INTRO = {
  focus: {
    title: '定点凝视',
    description: '盯着一个固定点，训练专注力',
    steps: [
      '找一个安静的地方坐好',
      '在眼前选择一个固定点（可以是墙上的点）',
      '保持视线稳定，不要眨眼',
      '如果思绪飘走，轻轻把它拉回来',
    ],
    icon: 'eye',
  },
  breathing: {
    title: '呼吸计数',
    description: '跟随节奏呼吸，感受呼吸的韵律',
    steps: [
      '坐直或躺下，放松身体',
      '跟随圆圈的缩放节奏呼吸',
      '吸气 → 屏息 → 呼气 → 屏息',
      '专注于呼吸的感觉',
    ],
    icon: 'leaf',
  },
  copying: {
    title: '静默抄写',
    description: '手写抄录，进入心流状态',
    steps: [
      '准备好纸和笔',
      '选择要抄写的内容（诗词、文章等）',
      '专注于每一个笔画',
      '感受书写的节奏和韵律',
    ],
    icon: 'create',
  },
};

export default function TrainingScreen() {
  const { addBoredomSession, state } = useApp();
  const { userData } = state;
  const defaultDuration = (userData?.settings.boredomTrainingDuration || 5) * 60;

  const [mode, setMode] = useState<ScreenMode>('select');
  const [selectedType, setSelectedType] = useState<TrainingType>('focus');
  const [isTraining, setIsTraining] = useState(false);
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [totalTime, setTotalTime] = useState(defaultDuration);
  const [afterScore, setAfterScore] = useState<number | null>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [elapsedTime, setElapsedTime] = useState(0);

  // 动画
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const focusDotAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const rotateLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const focusLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 入场动画
  useEffect(() => {
    if (mode === 'intro' || mode === 'training') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [mode]);

  useEffect(() => {
    if (!isTraining) {
      setTotalTime(defaultDuration);
      setTimeLeft(defaultDuration);
    }
  }, [defaultDuration, isTraining]);

  // 呼吸动画
  useEffect(() => {
    if (isTraining && selectedType === 'breathing') {
      runBreathCycle();
    } else {
      breathAnim.setValue(1);
      if (breathTimerRef.current) {
        clearTimeout(breathTimerRef.current);
      }
    }
    return () => {
      if (breathTimerRef.current) {
        clearTimeout(breathTimerRef.current);
      }
    };
  }, [isTraining, selectedType]);

  const runBreathCycle = () => {
    const phases: Array<{ phase: 'inhale' | 'hold1' | 'exhale' | 'hold2'; duration: number; scale: number }> = [
      { phase: 'inhale', duration: 4000, scale: 1.4 },
      { phase: 'hold1', duration: 4000, scale: 1.4 },
      { phase: 'exhale', duration: 4000, scale: 1 },
      { phase: 'hold2', duration: 4000, scale: 1 },
    ];

    let currentPhaseIndex = 0;

    const runPhase = () => {
      const { phase, duration, scale } = phases[currentPhaseIndex];
      setBreathPhase(phase);

      Animated.timing(breathAnim, {
        toValue: scale,
        duration: duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();

      breathTimerRef.current = setTimeout(() => {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        runPhase();
      }, duration);
    };

    runPhase();
  };

  // 凝视动画 - 中央点
  useEffect(() => {
    if (isTraining && selectedType === 'focus') {
      focusLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(focusDotAnim, {
            toValue: 1.2,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(focusDotAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      focusLoopRef.current.start();
    } else {
      focusLoopRef.current?.stop();
      focusDotAnim.setValue(1);
    }

    return () => {
      focusLoopRef.current?.stop();
    };
  }, [isTraining, selectedType]);

  // 倒计时
  useEffect(() => {
    if (isTraining) {
      // 背景旋转
      rotateLoopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 60000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoopRef.current.start();

      // 脉冲
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTraining(false);
            setMode('complete');
            return 0;
          }
          return prev - 1;
        });
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      pulseLoopRef.current?.stop();
      rotateLoopRef.current?.stop();
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      pulseLoopRef.current?.stop();
      rotateLoopRef.current?.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTraining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectTraining = (type: TrainingType) => {
    setSelectedType(type);
    setMode('intro');
  };

  const startTraining = () => {
    setTimeLeft(totalTime);
    setElapsedTime(0);
    setAfterScore(null);
    setIsTraining(true);
    setMode('training');
  };

  const cancelTraining = () => {
    setIsTraining(false);
    setMode('select');
    setTimeLeft(totalTime);
    setAfterScore(null);
    setElapsedTime(0);
  };

  const saveSession = () => {
    addBoredomSession({
      duration: elapsedTime,
      type: selectedType,
      afterFocusScore: afterScore || undefined,
    });
    setMode('select');
    setAfterScore(null);
    setElapsedTime(0);
  };

  const getBreathPhaseText = () => {
    switch (breathPhase) {
      case 'inhale': return '吸 气';
      case 'hold1': return '屏 息';
      case 'exhale': return '呼 气';
      case 'hold2': return '屏 息';
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 选择视图
  if (mode === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.selectionView}>
          <Text style={styles.title}>枯燥练习</Text>
          <Text style={styles.subtitle}>选择一种训练方式，提升专注耐受</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData?.stats.totalBoredomMinutes || 0}</Text>
              <Text style={styles.statLabel}>累计分钟</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData?.stats.boredomSessions.length || 0}</Text>
              <Text style={styles.statLabel}>练习次数</Text>
            </View>
          </View>

          <View style={styles.typeList}>
            {BOREDOM_TRAINING_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.typeCard}
                onPress={() => selectTraining(type.id as TrainingType)}
              >
                <View style={styles.typeCardContent}>
                  <View style={[styles.typeIconWrapper, 
                    type.id === 'focus' && { backgroundColor: Colors.primary + '20' },
                    type.id === 'breathing' && { backgroundColor: Colors.success + '20' },
                    type.id === 'copying' && { backgroundColor: Colors.accent + '20' },
                  ]}>
                    <Ionicons
                      name={type.icon as any}
                      size={28}
                      color={type.id === 'focus' ? Colors.primary : 
                             type.id === 'breathing' ? Colors.success : Colors.accent}
                    />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeDesc}>{type.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 介绍视图
  if (mode === 'intro') {
    const intro = TRAINING_INTRO[selectedType];
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          style={styles.introView}
          contentContainerStyle={styles.introScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => setMode('select')}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Animated.View style={[styles.introContent, { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }] 
          }]}>
            <View style={[styles.introIconWrapper,
              selectedType === 'focus' && { backgroundColor: Colors.primary + '20' },
              selectedType === 'breathing' && { backgroundColor: Colors.success + '20' },
              selectedType === 'copying' && { backgroundColor: Colors.accent + '20' },
            ]}>
              <Ionicons
                name={intro.icon as any}
                size={48}
                color={selectedType === 'focus' ? Colors.primary : 
                       selectedType === 'breathing' ? Colors.success : Colors.accent}
              />
            </View>
            <Text style={styles.introTitle}>{intro.title}</Text>
            <Text style={styles.introDesc}>{intro.description}</Text>

            <View style={styles.stepsContainer}>
              {intro.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* 时长选择 */}
            <View style={styles.durationSection}>
              <Text style={styles.durationLabel}>训练时长</Text>
              <View style={styles.durationOptions}>
                {[5, 7, 10].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationBtn,
                      totalTime === mins * 60 && styles.durationBtnSelected,
                    ]}
                    onPress={() => setTotalTime(mins * 60)}
                  >
                    <Text style={[
                      styles.durationBtnText,
                      totalTime === mins * 60 && styles.durationBtnTextSelected,
                    ]}>
                      {mins}分钟
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={startTraining}>
              <Text style={styles.startBtnText}>开始练习</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 训练视图
  if (mode === 'training') {
    return (
      <View style={styles.trainingContainer}>
        <StatusBar barStyle="dark-content" />

        {/* 背景动画 */}
        <Animated.View
          style={[styles.bgCircle, { transform: [{ scale: pulseAnim }, { rotate: spin }] }]}
        />

        <View style={styles.trainingContent}>
          <Text style={styles.trainingTitle}>
            {TRAINING_INTRO[selectedType].title}
          </Text>

          {/* 定点凝视 */}
          {selectedType === 'focus' && (
            <View style={styles.focusContainer}>
              <Animated.View style={[styles.focusDot, { transform: [{ scale: focusDotAnim }] }]} />
              <View style={styles.focusRing} />
              <View style={[styles.focusRing, styles.focusRingOuter]} />
            </View>
          )}

          {/* 呼吸计数 */}
          {selectedType === 'breathing' && (
            <View style={styles.breathContainer}>
              <Animated.View style={[styles.breathCircle, { transform: [{ scale: breathAnim }] }]}>
                <Text style={styles.breathPhaseText}>{getBreathPhaseText()}</Text>
              </Animated.View>
              <View style={styles.breathRing} />
            </View>
          )}

          {/* 抄写 */}
          {selectedType === 'copying' && (
            <View style={styles.copyingContainer}>
              <View style={styles.copyingPen}>
                <Ionicons name="create" size={48} color={Colors.text} />
              </View>
              <View style={styles.copyingLines}>
                <View style={styles.copyingLine} />
                <View style={styles.copyingLine} />
                <View style={styles.copyingLine} />
              </View>
            </View>
          )}

          {/* 计时器 */}
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerLabel}>剩余时间</Text>
            </Animated.View>
          </View>

          {/* 提示 */}
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              {selectedType === 'focus' && '保持视线稳定，思绪飘走时轻轻拉回'}
              {selectedType === 'breathing' && '跟随圆圈的节奏，感受呼吸'}
              {selectedType === 'copying' && '专注于每一个笔画，感受书写'}
            </Text>
          </View>

          {/* 取消按钮 */}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelTraining}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
            <Text style={styles.cancelBtnText}>结束练习</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 完成视图
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.completeView}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>
        <Text style={styles.completeTitle}>练习完成！</Text>
        <Text style={styles.completeSubtitle}>
          本次训练 {formatTime(elapsedTime)}
        </Text>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>训练后感觉如何？</Text>
          <View style={styles.scoreOptions}>
            {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score}
                style={[
                  styles.scoreBtn,
                  afterScore === score && styles.scoreBtnSelected,
                ]}
                onPress={() => setAfterScore(score)}
              >
                <Text style={[
                  styles.scoreBtnText,
                  afterScore === score && styles.scoreBtnTextSelected,
                ]}>
                  {score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.scoreLabels}>
            <Text style={styles.scoreLabelSmall}>很难受</Text>
            <Text style={styles.scoreLabelSmall}>很清醒</Text>
          </View>
        </View>

        <View style={styles.completeActions}>
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={() => {
              setMode('select');
              setAfterScore(null);
              setElapsedTime(0);
            }}
          >
            <Text style={styles.discardBtnText}>放弃记录</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={saveSession}>
            <Text style={styles.saveBtnText}>保存记录</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  selectionView: {
    flex: 1,
    padding: 20,
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
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  typeList: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  typeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  typeIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  typeName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  // 介绍视图
  introView: {
    flex: 1,
  },
  introScrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  introContent: {
    flexGrow: 1,
  },
  introIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  stepsContainer: {
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.card,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  durationSection: {
    marginBottom: 32,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  durationBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  durationBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  durationBtnTextSelected: {
    color: Colors.primary,
  },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.card,
  },

  // 训练视图
  trainingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgCircle: {
    position: 'absolute',
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    borderWidth: 1,
    borderColor: Colors.primary + '15',
    top: '50%',
    left: '50%',
    marginLeft: -width,
    marginTop: -width,
  },
  trainingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  trainingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 40,
  },
  focusContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  focusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  focusRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  focusRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderColor: Colors.primary + '20',
  },
  breathContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  breathCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.success + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.success,
  },
  breathPhaseText: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: 4,
  },
  breathRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  copyingContainer: {
    width: 200,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  copyingPen: {
    marginBottom: 20,
  },
  copyingLines: {
    width: '100%',
    gap: 16,
  },
  copyingLine: {
    height: 2,
    backgroundColor: Colors.textMuted + '40',
    borderRadius: 1,
  },
  timerContainer: {
    marginBottom: 32,
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  timerText: {
    fontSize: 40,
    fontWeight: '200',
    color: Colors.text,
  },
  timerLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  hintCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 32,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 8,
  },

  // 完成视图
  completeView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  completeIcon: {
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  scoreSection: {
    width: '100%',
    marginBottom: 40,
  },
  scoreLabel: {
    fontSize: 16,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnSelected: {
    backgroundColor: Colors.primary,
  },
  scoreBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scoreBtnTextSelected: {
    color: Colors.card,
  },
  scoreLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  scoreLabelSmall: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  completeActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  discardBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  discardBtnText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.card,
  },
});
