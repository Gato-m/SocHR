import { Redirect } from 'expo-router';
import React from 'react';

export default function App() {
  // Start the app at the splash screen so we can perform onboarding checks
  return <Redirect href="/splash" />;
}
