import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  useEffect(() => {
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);
  }, []);

  return (
    <View>
      <Text>SplashScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
