import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { radius as r } from '../theme/typography';

/*
 * Dönen gradient border efekti.
 * Teknik:
 *  1. Dış kapsayıcı: overflow:hidden + borderRadius
 *  2. İçinde 2× büyük dönen LinearGradient → border rengi verir
 *  3. Üstünde: içerik view'ı, borderWidth kadar inset + aynı borderRadius
 *
 * Props:
 *   borderWidth   – border kalınlığı (default 1.5)
 *   borderRadius  – köşe yarıçapı (default radius.xl2)
 *   duration      – tam tur süresi ms (default 3000)
 *   colors        – gradient renkleri array
 *   glowOpacity   – dış glow yoğunluğu (default 0.5)
 *   style         – dış kapsayıcı style
 *   contentStyle  – içerik alanı style
 *   children
 */
export default function AnimatedGradientBorder({
  borderWidth   = 1.5,
  borderRadius  = r.xl2,
  duration      = 3200,
  gradientColors = [
    colors.primary,
    '#0EA5E9',
    '#6063EE',
    '#38BDF8',
    colors.primary,
  ],
  glowOpacity   = 0.35,
  style,
  contentStyle,
  children,
}) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[st.outer, { borderRadius }, style]}>
      {/* ── Dönen gradient katmanı ── */}
      <Animated.View
        style={[
          st.rotator,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.gradient}
        />
      </Animated.View>

      {/* ── Dış glow (opsiyonel) ── */}
      <Animated.View
        style={[
          st.rotator,
          st.glow,
          { opacity: glowOpacity, transform: [{ rotate: spin }] },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.gradient}
        />
      </Animated.View>

      {/* ── İçerik ── */}
      <View
        style={[
          st.content,
          {
            borderRadius: borderRadius - borderWidth,
            margin: borderWidth,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const SIZE = 600; // dönen elemanın boyutu (büyük olması lazım)

const st = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    position: 'relative',
  },
  rotator: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    top: '50%',
    left: '50%',
    marginTop:  -SIZE / 2,
    marginLeft: -SIZE / 2,
  },
  gradient: {
    flex: 1,
    borderRadius: SIZE / 2,
  },
  glow: {
    transform: [{ scale: 1.15 }],
  },
  content: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
});
