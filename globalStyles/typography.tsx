// globalStyles/Typography.js
import { StyleSheet, Text } from 'react-native';
import type { TextProps, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from './theme';

type Variant = 'primary' | 'secondary';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

export const Title: React.FC<TypographyProps> = ({ children, style, ...props }) => (
  <Text style={[styles.title, style]} {...props}>
    {children}
  </Text>
);

interface BodyProps extends TypographyProps {
  variant?: Variant;
}

export const Body: React.FC<BodyProps> = ({ children, style, variant = 'primary', ...props }) => (
  <Text style={[styles.body, styles[variant], style]} {...props}>
    {children}
  </Text>
);

export const Caption: React.FC<TypographyProps> = ({ children, style, ...props }) => (
  <Text style={[styles.caption, style]} {...props}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.text,
  },
  body: {
    fontSize: TYPOGRAPHY.md,
  },
  primary: {
    color: COLORS.text,
  },
  secondary: {
    color: COLORS.text,
  },
  caption: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
  },
});
