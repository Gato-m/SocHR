import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React from 'react';
import { Button, Text, View } from 'react-native';

export default function OnboardingScreen() {
  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View>
      <Text>Onboarding Screen</Text>
      <Button title="Sākt lietot" onPress={finishOnboarding} />
    </View>
  );
}
