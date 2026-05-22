import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const { width: W } = Dimensions.get('window');

/*
 * Shimmer yaklaşımı:
 *  - Altta: static Text (her zaman görünür, renk = primary)
 *  - Üstte: overflow:hidden kapsayıcı içinde kayan LinearGradient
 *    gradient: transparent → parlak beyaz-mavi → transparent
 *    Bu gradient metnin üstünden geçerken parlaklık efekti verir.
 *  - Text kaybolmaz çünkü alt katman her zaman orada.
 */
export default function ShimmerLogo({ text = 'Kairos', size, style }) {
  const textSize  = size ?? 34;
  const shimmerX  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: 1,
          duration: 3400,
          useNativeDriver: true,
        }),
        Animated.delay(1600),
      ])
    ).start();
  }, []);

  // Gradient bandı: -containerW'dan +containerW'ya kayar
  // Özellikle geniş tutarak sıfırlama anında boşluk kalmasın
  const BAND  = W * 0.55;
  const RANGE = W * 1.4;

  const translateX = shimmerX.interpolate({
    inputRange:  [0, 1],
    outputRange: [-RANGE / 2, RANGE / 2],
  });

  return (
    <View style={[st.root, style]}>
      {/* ── Alt katman: her zaman görünür ── */}
      <Text style={[st.text, { fontSize: textSize }]}>{text}</Text>

      {/* ── Üst katman: kayan parlaklık bandı ── */}
      <View style={[StyleSheet.absoluteFill, st.clipper]} pointerEvents="none">
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0)',
              'rgba(147,197,253,0.55)',  // blue-300
              'rgba(219,234,254,0.85)',  // blue-100 peak
              'rgba(147,197,253,0.55)',
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0)',
            ]}
            locations={[0, 0.3, 0.42, 0.5, 0.58, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, width: BAND }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: fonts.display,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  clipper: {
    overflow: 'hidden',
  },
});
