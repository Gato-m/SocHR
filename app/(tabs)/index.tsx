import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDERRADIUS, COLORS, SPACING, TYPOGRAPHY, flexPatterns } from '../../globalStyles';
export default function index() {
  return (
    <SafeAreaView
      style={[
        { borderRadius: BORDERRADIUS.md },
        flexPatterns.centered,
        { backgroundColor: COLORS.background },
      ]}
    >
      <View>
        <Text
          style={[
            { margin: SPACING.xl },
            flexPatterns.textCenter,
            { color: COLORS.text },
            { fontSize: TYPOGRAPHY.md },
          ]}
        >
          Prombutne
        </Text>
        <Text
          style={[
            { margin: SPACING.xl },
            flexPatterns.textCenter,
            { color: COLORS.text },
            { fontSize: TYPOGRAPHY.xl, fontWeight: 'bold' },
          ]}
        >
          Prombutne
        </Text>
        <Text
          style={[
            { margin: SPACING.xl },
            { color: COLORS.text },
            flexPatterns.textCenter,
            { fontSize: TYPOGRAPHY.sm },
          ]}
        >
          Prombutne
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: 'red',
    fontSize: 20,
  },
});
