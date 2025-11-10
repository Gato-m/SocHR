import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Caption, COLORS, flexPatterns, Title, TYPOGRAPHY } from '../../globalStyles/index';

export default function index() {
  return (
    <SafeAreaView
      style={[flexPatterns.centered, { height: '100%' }, { backgroundColor: COLORS.komandejums }]}
    >
      <View
        style={[
          flexPatterns.center,
          flexPatterns.flex1,
          { paddingHorizontal: TYPOGRAPHY.lg },
          { backgroundColor: COLORS.iislaiciigs },
        ]}
      >
        <Title>Title Prombutne</Title>
        <Body variant="secondary" style={[{ paddingVertical: TYPOGRAPHY.md }]}>
          Body Prombutne
        </Body>
        <Caption>Caption Prombutne</Caption>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   height: '100%',
  //   padding: TYPOGRAPHY.md,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   // backgroundColor: COLORS.borderColorGray,
  // },
  // title: {
  //   fontSize: TYPOGRAPHY.xl,
  //   color: COLORS.text,
  // },
  // body: {
  //   fontSize: TYPOGRAPHY.lg,
  //   paddingVertical: TYPOGRAPHY.md,
  //   color: COLORS.primary,
  // },
});
