// components/ThemeToggle.tsx
import { Button } from 'react-native';
import { useTheme } from '../globalStyles/ThemeContext';

export const ThemeToggle = () => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <Button
      title={isDark ? 'Toggle to Light Theme' : 'Toggle to Dark Theme'}
      onPress={toggleTheme}
      color={theme.buttonTitle.color}
      style={theme.buttonTitle}
    />
  );
};
