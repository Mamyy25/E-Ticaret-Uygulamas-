import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';

export default function Input({
  label,
  error,
  hint,
  style,
  containerStyle,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space[1] + 2,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primaryRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
