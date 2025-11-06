// navigation/MainTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import addData from '../app/(tabs)/addData';
import index from '../app/(tabs)/index';
import personal from '../app/(tabs)/personal';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Prombutne" component={index} />
      <Tab.Screen name="Pievienot" component={addData} />
      <Tab.Screen name="Personals" component={personal} />
    </Tab.Navigator>
  );
}
