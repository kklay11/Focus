import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import TabNavigator from './src/navigation/TabNavigator';
import { Colors } from './src/constants';
import { AppProvider, useApp } from './src/context';

// 阻止 splash screen 自动隐藏
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { state, error } = useApp();

  useEffect(() => {
    if (!state.isLoading) {
      // 数据加载完成后隐藏 splash screen
      SplashScreen.hideAsync();
    }
  }, [state.isLoading]);

  if (state.isLoading) {
    return null; // Splash screen 仍然显示
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>加载失败</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
      <NavigationContainer>
        <StatusBar style="dark" />
      <TabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    color: Colors.error,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorDetail: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
