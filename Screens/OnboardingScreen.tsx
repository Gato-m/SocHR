// Screens/OnboardingScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, COLORS, SPACING, TYPOGRAPHY } from '../globalStyles';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: 'on1',
    image: require('../assets/images/on1.png'),
    lines: [
      'Izvēlies kategoriju, atzīmē datumus, pieraksti īsu komentāru, ja ir ko piebilst, un dari zināmu pārējiem par savu prombūtni.',
    ],
  },
  {
    key: 'on2',
    image: require('../assets/images/on2.png'),
    lines: ['Pavelc prombūtni — esošo kolēģu sarakstu ekrānā uz leju, tādējādi atjaunojot datus.'],
  },
  {
    key: 'on3',
    image: require('../assets/images/on3.png'),
    lines: [
      'Sazinies ar kolēģiem, kuri ir prombūtne, bet nav pazuduši pavisam — viņi var būt pieejami pa telefonu.',
    ],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const scrollX = useRef(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(tabs)');
  };

  const renderItem = ({ item, index }: { item: (typeof slides)[number]; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.current.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.current.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.Image
          source={item.image}
          style={[styles.image, { transform: [{ scale }], opacity }]}
          resizeMode="contain"
        />

        {/* Controls + dots + text all inside the slide, centered vertically */}
        <View style={styles.slideControlsWrapper}>
          <View style={styles.controlsRowInline}>
            {index > 0 ? (
              <Pressable
                onPress={() => flatListRef.current?.scrollToIndex({ index: index - 1 })}
                style={styles.controlButton}
              >
                <Text style={styles.controlIcon} accessibilityLabel="Back">
                  ‹
                </Text>
              </Pressable>
            ) : (
              <View style={styles.controlPlaceholder} />
            )}

            <View style={styles.pagination}>
              {slides.map((_, i) => {
                const dotInput = [(i - 1) * width, i * width, (i + 1) * width];
                const dotWidth = scrollX.current.interpolate({
                  inputRange: dotInput,
                  outputRange: [8, 24, 8],
                  extrapolate: 'clamp',
                });
                const dotRadius = scrollX.current.interpolate({
                  inputRange: dotInput,
                  outputRange: [4, 8, 4],
                  extrapolate: 'clamp',
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        width: dotWidth,
                        borderRadius: dotRadius,
                        backgroundColor: i === index ? COLORS.primary : COLORS.gray,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {index < slides.length - 1 ? (
              <Pressable
                onPress={() => flatListRef.current?.scrollToIndex({ index: index + 1 })}
                style={styles.controlButton}
              >
                <Text style={styles.controlIcon} accessibilityLabel="Next">
                  ›
                </Text>
              </Pressable>
            ) : (
              <View style={styles.controlPlaceholder} />
            )}
          </View>

          <View style={styles.textContainerInline}>
            {item.lines.map((line, idx) => (
              <Body key={idx} variant={idx === 0 ? 'primary' : 'secondary'} style={styles.lineText}>
                {line}
              </Body>
            ))}
          </View>

          {index === slides.length - 1 && (
            <Pressable onPress={finishOnboarding} style={styles.ienaktButton}>
              <Text style={styles.ienaktText}>Ienākt</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        onPress={finishOnboarding}
        style={[styles.skipTopButton, { top: insets.top + SPACING.xs }]}
      >
        <Text style={styles.skipTopText}>Izlaist</Text>
      </Pressable>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX.current } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      />

      {/* Footer removed - controls, dots, text and Ienākt are now inside each slide */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  image: {
    width: '60%',
    height: '60%',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  lineText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    marginVertical: SPACING.xs,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0a84ff',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 56,
    marginBottom: 24,
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  controlButton: {
    paddingVertical: 0,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.md,
  },
  controlPlaceholder: {
    width: 24,
  },
  slideControlsWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  controlsRowInline: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  textContainerInline: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  controlIcon: {
    fontSize: 30,
    lineHeight: 30,
    color: COLORS.text,
    paddingHorizontal: SPACING.xs,
    textAlign: 'center',
  },
  controlButtonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  controlTextPrimary: {
    color: COLORS.white,
    fontWeight: '600',
  },
  footerRow: {
    width: '100%',
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  skipText: {
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.md,
  },
  skipTopButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 20,
    padding: SPACING.xs,
  },
  skipTopText: {
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  ienaktButton: {
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  ienaktText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.md,
    textAlign: 'center',
  },
});
