import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../Components/Header';
import { COLORS } from '../../globalStyles/theme';

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#ee4023',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingTop: 10,
            paddingBottom: 0,
            height: 60,
            backgroundColor: COLORS.background,
            borderTopWidth: 1,
            borderTopColor: COLORS.borderColorGray,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => (
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.background,
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
              }}
            />
          ),
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
