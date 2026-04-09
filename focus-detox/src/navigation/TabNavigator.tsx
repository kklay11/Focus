import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from '../types';
import { Colors } from '../constants';

import HomeScreen from '../screens/HomeScreen';
import LowStimScreen from '../screens/LowStimScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ExamResetScreen from '../screens/ExamResetScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'LowStim':
              iconName = focused ? 'moon' : 'moon-outline';
              break;
            case 'Training':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'ExamReset':
              iconName = focused ? 'flash' : 'flash-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.backgroundLight,
          borderTopWidth: 1,
          shadowColor: '#9FB2CC',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="LowStim" 
        component={LowStimScreen}
        options={{ tabBarLabel: '低刺激' }}
      />
      <Tab.Screen 
        name="Training" 
        component={TrainingScreen}
        options={{ tabBarLabel: '练习' }}
      />
      <Tab.Screen 
        name="ExamReset" 
        component={ExamResetScreen}
        options={{ tabBarLabel: '状态' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}
