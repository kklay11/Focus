# Focus Detox

一个面向备考学生、知识工作者和容易被短视频分散注意力人群的 **多巴胺脱敏与专注训练 App**。项目聚焦“降低高刺激依赖、提升低刺激耐受、恢复深度专注”三件事，用可执行的训练流程替代空泛的自控口号。

## 项目简介

高刺激内容会不断抬高大脑对“即时反馈”的预期，结果就是：

- 很难静下心做枯燥但重要的事
- 学习和工作时容易频繁切屏、走神、脑雾
- 对慢节奏任务产生明显抗拒

Focus Detox 通过移动端训练模块，帮助用户逐步重建稳定、耐受、可持续的专注状态。

## 当前功能

### 低刺激窗口

- 提供晨间 / 夜间低刺激时段训练
- 引导用户远离电子屏幕，替换为低刺激行为
- 支持每日完成记录与连续打卡

### 枯燥练习

- 提供凝视、呼吸计数、静默抄写等训练方式
- 使用短时长练习提升对单调任务的耐受
- 统计训练时长与完成记录

### 状态重置

- 面向脑雾、卡顿、注意力断裂等时刻
- 提供快速动作引导与完成记录
- 适用于学习、考试、工作切换等场景

### 个人中心

- 查看等级、连续天数、累计训练数据
- 管理训练设置与节奏信息
- 承载后续成就、统计与引导能力

## 技术栈

| 类别 | 说明 |
| --- | --- |
| 框架 | Expo + React Native |
| 语言 | TypeScript |
| 导航 | React Navigation |
| 存储 | AsyncStorage |
| 目标平台 | Android / iOS |

## 目录结构

```text
E:\Project\fomo
├─ AGENTS.md
├─ README.md
├─ dopamine-focus-md_aa793516.plan.md
└─ focus-detox
   ├─ App.tsx
   ├─ app.json
   ├─ index.ts
   ├─ package.json
   ├─ tsconfig.json
   ├─ assets/
   └─ src/
      ├─ components/
      ├─ constants/
      ├─ context/
      ├─ navigation/
      ├─ screens/
      ├─ types/
      └─ utils/
```

## 本地启动

```bash
cd E:\Project\fomo\focus-detox
npm install
npm start
```

常用命令：

```bash
npm run android
npm run ios
npm run web
```

> 项目产品目标以移动端为主，Web 仅用于 Expo 调试预览。

## 应用结构说明

- `App.tsx`：应用根部装配，负责安全区、全局状态与导航容器
- `src/context/AppContext.tsx`：统一管理用户数据、统计、今日任务与持久化写入
- `src/navigation/TabNavigator.tsx`：底部标签页入口，包含首页、低刺激、练习、状态、我的五个主模块
- `src/constants/index.ts`：主题色、默认设置、业务常量
- `src/utils/storage.ts`：基于 AsyncStorage 的本地持久化能力

## 产品方向

后续计划继续完善以下方向：

1. 成就系统与长期反馈
2. 更细粒度的训练统计和可视化
3. 提醒、引导与新手流程
4. 数据备份与同步能力

## 仓库命名建议

如果你准备新建 GitHub 仓库，推荐直接使用：

`focus-detox`
