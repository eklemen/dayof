import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '@/lib/constants';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const iconLeft = icon && iconPosition === 'left';
  const iconRight = icon && iconPosition === 'right';

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'text' ? COLORS.primary[700] : 'white'} 
          size="small" 
        />
      ) : (
        <>
          {iconLeft}
          {title && <Text style={textStyles}>{title}</Text>}
          {iconRight}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
  },
  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary[700],
  },
  primaryText: {
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary[500],
  },
  secondaryText: {
    color: 'white',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary[700],
  },
  outlineText: {
    color: COLORS.primary[700],
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  textText: {
    color: COLORS.primary[700],
  },
  // Sizes
  smallButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
  },
  smallText: {
    fontSize: 14,
  },
  mediumButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
  },
  mediumText: {
    fontSize: 16,
  },
  largeButton: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  largeText: {
    fontSize: 18,
  },
  // States
  disabledButton: {
    backgroundColor: COLORS.gray[300],
    borderColor: COLORS.gray[300],
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.gray[500],
  },
});