import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';

// variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
// size: 'sm' | 'md'

const variantMap = {
  primary: { bg: colors.primarySoft, text: colors.primary, border: colors.primaryRing },
  success: { bg: colors.successSoft, text: colors.success, border: colors.successBorder },
  warning: { bg: colors.warningSoft, text: colors.warning, border: 'rgba(180,83,9,0.2)' },
  danger:  { bg: colors.dangerSoft,  text: colors.danger,  border: 'rgba(186,26,26,0.2)' },
  info:    { bg: colors.infoSoft,    text: colors.info,    border: 'rgba(3,105,161,0.2)' },
  neutral: { bg: colors.surfaceRaised, text: colors.textSecondary, border: colors.borderSubtle },
};

export default function Badge({ label, variant = 'neutral', size = 'sm', dot = false, style }) {
  const v = variantMap[variant] || variantMap.neutral;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: size === 'sm' ? 2 : space[1] + 2,
          paddingHorizontal: size === 'sm' ? space[2] : space[3],
        },
        style,
      ]}
    >
      {dot && (
        <View style={[styles.dot, { backgroundColor: v.text }]} />
      )}
      <Text style={[styles.text, { color: v.text, fontSize: size === 'sm' ? fontSize.xs : fontSize.sm }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
  },
});
