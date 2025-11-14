import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../Components/Header';
import { COLORS } from '../../globalStyles/theme';

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header />
      <Tabs
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingTop: 5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mājas',
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="addData"
          options={{
            title: 'Pievienot',
            tabBarIcon: ({ color }) => <FontAwesome name="plus-square" size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="personal"
          options={{
            title: 'Personals',
            tabBarIcon: ({ color }) => <FontAwesome name="user" size={28} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
