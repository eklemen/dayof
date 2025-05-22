import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '@/lib/constants';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({ 
  children, 
  style, 
  variant = 'default',
  padding = 'medium' 
}: CardProps) {
  return (
    <View style={[
      styles.card,
      styles[`${variant}Card`],
      styles[`${padding}Padding`],
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  // Variants
  defaultCard: {
    backgroundColor: 'white',
  },
  outlinedCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  elevatedCard: {
    backgroundColor: 'white',
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Padding
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: SPACING.s,
  },
  mediumPadding: {
    padding: SPACING.m,
  },
  largePadding: {
    padding: SPACING.l,
  },
});