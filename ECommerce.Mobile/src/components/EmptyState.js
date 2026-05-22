import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts, fontSize, space } from '../theme/typography';
import Button from './Button';

export default function EmptyState({ icon = 'search-outline', title, description, action, onAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && (
        <Button label={action} onPress={onAction} variant="secondary" size="sm" style={{ marginTop: space[4] }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[12],
    paddingHorizontal: space[6],
    gap: space[2],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
  },
});
