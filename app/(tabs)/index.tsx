import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Title } from '../../globalStyles/typography';
import { COLORS, TYPOGRAPHY, SPACING } from '../../globalStyles/theme';
import { flexPatterns } from '../../globalStyles/layoutStyles';
import { useTheme } from '../../globalStyles/ThemeContext';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function Index() {
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
      <Title style={styles.title}>HOME SCREEN</Title>
      <Body style={styles.text}>Home screen</Body>

      <Link href="/personal" style={styles.button}>
        Go to Contacts screen
      </Link>
      <Link href="/statistic" style={styles.button}>
        Go to Statistic screen
      </Link>
      <Link href="/admin" style={[styles.button, { marginBottom: SPACING.md }]}>
        Go to Admin screen
      </Link>

      <ThemeToggle />
    </View>
  );
}
