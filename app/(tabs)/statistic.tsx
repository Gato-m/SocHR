import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Title } from '../../globalStyles/typography';
import { flexPatterns } from '../../globalStyles/layoutStyles';
import { TYPOGRAPHY, SPACING } from '../../globalStyles/theme';
import { useTheme } from '../../globalStyles/ThemeContext';

export default function Statistic() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: theme.colors.text,
      fontSize: TYPOGRAPHY.xl,
      fontWeight: 'bold',
      marginBottom: SPACING.md,
    },
    text: {
      color: theme.colors.text,
      marginBottom: SPACING.md,
    },
    button: {
      marginTop: SPACING.md,
      padding: SPACING.md,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      color: '#fff',
      textAlign: 'center',
      width: 200,
    },
  });

  return (
    <View style={[styles.container, flexPatterns.center]}>
      <Title style={styles.title}>STATISTIC</Title>
      <Body style={styles.text}>Statistic screen</Body>
      <Link href="/" style={styles.button}>
        Go to Home screen
      </Link>
    </View>
  );
}
