import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../globalStyles/ThemeContext';

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  // Define tab screens with their configurations
  const tabs = [
    {
      name: 'statistic',
      title: 'Statistics',
      icon: (focused: boolean) => 
        focused ? 'stats-chart' : 'stats-chart-outline',
    },
    {
      name: 'personal',
      title: 'Darbinieki',
      icon: (focused: boolean) => 
        focused ? 'people' : 'people-outline',
    },
    {
      name: 'admin',
      title: 'Admin',
      icon: (focused: boolean) => 
        focused ? 'settings' : 'settings-outline',
    },
  ];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          paddingTop: 8,
          backgroundColor: isDark ? '#1a1a1bff' : '#f5f5f5',
          borderTopColor: isDark ? '#333' : '#e0e0e0',
        },
        tabBarInactiveTintColor: theme.colors.text,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={tab.icon(focused)}
                color={color}
                size={24}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
