// app/splash.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import SocLogo from '../assets/images/SocLogo';

export default function SplashScreen() {
  useEffect(() => {
    const checkOnboarding = async () => {
      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
      console.log('SplashScreen: hasOnboarded =', hasOnboarded);
      setTimeout(() => {
        if (hasOnboarded === 'true') {
          router.replace('/onboarding');
        } else {
          router.replace('/onboarding');
        }
      }, 2000); // 3 sekundes
    };

    checkOnboarding();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <SocLogo size={90} />
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 20 }}>Laipni lūdzam!</Text>
    </View>
  );
}
