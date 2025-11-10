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

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        onPress={finishOnboarding}
        style={[styles.skipTopButton, { top: insets.top + SPACING.xs }]}
      >
        <Text style={styles.skipTopText}>Izlaist</Text>
      </Pressable>

      <View style={styles.mainContainer}>
        <View style={styles.topSection}>
          <FlatList
            ref={flatListRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            renderItem={({ item, index }) => (
              <View style={[styles.imageSlide, { width }]}>
                <View style={styles.imageContainer}>
                  <Animated.Image
                    source={item.image}
                    style={[
                      styles.image,
                      {
                        transform: [
                          {
                            scale: scrollX.current.interpolate({
                              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                              outputRange: [0.9, 1, 0.9],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                        opacity: scrollX.current.interpolate({
                          inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                          outputRange: [0.6, 1, 0.6],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfigRef.current}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX.current } } }], {
              useNativeDriver: false,
            })}
            scrollEventThrottle={16}
          />
        </View>

        <View style={styles.paginationFixed}>
          {slides.map((_, i) => {
            const dotWidth = scrollX.current.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotRadius = scrollX.current.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
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
                    backgroundColor: i === currentIndex ? COLORS.primary : COLORS.gray,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.bottomSection}>
          <FlatList
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            renderItem={({ item, index }) => (
              <View style={[styles.textSlide, { width }]}>
                <View style={styles.textContainerInline}>
                  {item.lines.map((line: string, idx: number) => (
                    <Body
                      key={idx}
                      variant={idx === 0 ? 'primary' : 'secondary'}
                      style={styles.lineText}
                    >
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
            )}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX.current } } }], {
              useNativeDriver: false,
            })}
            scrollEventThrottle={16}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
    marginTop: '40%',
  },
  topSection: {
    height: 350,
  },
  bottomSection: {
    flex: 1,
  },

  // Image Section
  imageSlide: {
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '60%',
    height: 300,
  },

  // Pagination
  paginationFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: COLORS.gray,
  },

  // Text Section
  textSlide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  textContainerInline: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  lineText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    marginVertical: SPACING.xs,
    textAlign: 'center',
  },

  // Buttons
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
