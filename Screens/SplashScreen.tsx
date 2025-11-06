import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function SplashScreen() {
  useEffect(() => {
    const checkOnboarding = async () => {
      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
      setTimeout(() => {
        if (hasOnboarded === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('./onboarding');
        }
      }, 3500); // neliels splash delays
    };

    checkOnboarding();
  }, []);

  return (
    <View>
      <Text>Splash Screen</Text>
    </View>
  );
}
