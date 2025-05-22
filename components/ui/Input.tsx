import { StyleSheet, TextInput, View, Text, TextInputProps, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '@/lib/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ 
  label, 
  error, 
  containerStyle, 
  ...props 
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          props.multiline ? styles.multilineInput : null,
        ]}
        placeholderTextColor={COLORS.gray[400]}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SPACING.xs,
    color: COLORS.gray[700],
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error[500],
  },
  errorText: {
    color: COLORS.error[500],
    marginTop: SPACING.xs,
    fontSize: 14,
  },
});