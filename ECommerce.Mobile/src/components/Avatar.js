import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius } from '../theme/typography';

// size: number (px)
// online: boolean — yeşil nokta göster
export default function Avatar({ name, uri, size = 40, online = false, style }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primarySoft,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.35, color: colors.primary }]}>
            {initials}
          </Text>
        )}
      </View>
      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              width: size * 0.26,
              height: size * 0.26,
              borderRadius: (size * 0.26) / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  initials: {
    fontFamily: fonts.bodySemiBold,
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
