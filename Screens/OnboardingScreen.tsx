import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View>
      <Text>OnboardingScreen</Text>
      <Button title="Sākt lietot" onPress={() => navigation.replace('MainTabs')} />
    </View>
  );
}

const styles = StyleSheet.create({});
