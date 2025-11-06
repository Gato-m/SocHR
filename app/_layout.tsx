import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade', // 'slide_from_right', 'slide_from_bottom', 'none'
      }}
    />
  );
}
