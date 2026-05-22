import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSize, space } from '../theme/typography';

export default function SectionHeader({ title, action, onAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[3],
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  action: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
