import React, { useRef } from 'react';
import { Pressable, Animated, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';

const variants = {
  primary:   { bg: colors.primary,   border: colors.primary,   text: colors.textInverse,   pressed: colors.primaryPressed },
  secondary: { bg: colors.surface,   border: colors.border,    text: colors.text,          pressed: colors.surfaceRaised },
  ghost:     { bg: 'transparent',    border: 'transparent',    text: colors.primary,       pressed: colors.primarySoft },
  danger:    { bg: colors.danger,    border: colors.danger,    text: colors.textInverse,   pressed: colors.dangerHover },
};

const sizes = {
  sm: { pV: space[2],     pH: space[4],  textSize: fontSize.sm },
  md: { pV: space[3],     pH: space[5],  textSize: fontSize.base },
  lg: { pV: space[4],     pH: space[6],  textSize: fontSize.md },
};

export default function Button({
  label,
  onPress,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) {
  const v          = variants[variant] ?? variants.primary;
  const sz         = sizes[size]       ?? sizes.md;
  const isDisabled = disabled || loading;

  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 0.955, useNativeDriver: true, friction: 8, tension: 120 }),
      Animated.timing(opacity, { toValue: 0.88,  useNativeDriver: true, duration: 80 }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1,   useNativeDriver: true, friction: 4, tension: 60 }),
      Animated.timing(opacity, { toValue: 1,   useNativeDriver: true, duration: 120 }),
    ]).start();
  };

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      onPressIn={!isDisabled ? onPressIn : undefined}
      onPressOut={!isDisabled ? onPressOut : undefined}
      style={fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }}
    >
      <Animated.View
        style={[
          st.base,
          {
            backgroundColor: isDisabled ? colors.borderSubtle : v.bg,
            borderColor:     isDisabled ? colors.border        : v.border,
            paddingVertical:   sz.pV,
            paddingHorizontal: sz.pH,
            transform: [{ scale }],
            opacity,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.text} />
        ) : (
          <Text
            style={[
              st.label,
              { color: isDisabled ? colors.textDisabled : v.text, fontSize: sz.textSize },
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.1,
  },
});
