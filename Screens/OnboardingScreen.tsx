// app/onboarding.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function OnboardingScreen() {
  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>Sveicināts lietotnē!</Text>
      <Button title="Sākt lietot" onPress={finishOnboarding} />
    </View>
  );
}
