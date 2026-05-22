import { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ── Ay yıldız SVG yolları (200x200 viewBox) ────────────────────
// Hilal: büyük daire (merkez:100,100 r:70) - küçük daire (merkez:124,100 r:58)
// Kesişim noktaları: (144, 45.56) ve (144, 154.44) — matematiksel doğrulama yapıldı
const CRESCENT =
  'M 144 45.56 A 70 70 0 1 0 144 154.44 A 58 58 0 1 1 144 45.56 Z';

// 5 köşeli yıldız: merkez (166,100), dış r=20, iç r=7.64 (0.382×20)
const STAR =
  'M 166 80 L 170.49 93.82 L 185.02 93.82 L 173.27 102.36 ' +
  'L 177.76 116.18 L 166 107.64 L 154.24 116.18 L 158.73 102.36 ' +
  'L 146.98 93.82 L 161.51 93.82 Z';

const VIOLET = 'rgba(167,139,250,1)';

// ── Tek sembol SVG ─────────────────────────────────────────────
const AyYildiz = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200">
    <Path d={CRESCENT} fill={VIOLET} />
    <Path d={STAR}     fill={VIOLET} />
  </Svg>
);

// ── Animated arka plan bileşeni ────────────────────────────────
const AdminSymbol = () => {
  const rot1   = useRef(new Animated.Value(0)).current;
  const rot2   = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0.10)).current;

  useEffect(() => {
    // Büyük sembol: 60 saniyede bir tam tur (saat yönü)
    Animated.loop(
      Animated.timing(rot1, { toValue: 1, duration: 60000, useNativeDriver: true })
    ).start();

    // Küçük sembol: 45 saniyede bir tam tur (saat yönü tersi)
    Animated.loop(
      Animated.timing(rot2, { toValue: 1, duration: 45000, useNativeDriver: true })
    ).start();

    // Nefes alma efekti: opaklık 0.07 ↔ 0.15
    Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 0.15, duration: 4500, useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0.07, duration: 4500, useNativeDriver: true }),
    ])).start();
  }, []);

  const spin1 = rot1.interpolate({ inputRange: [0, 1], outputRange: ['0deg',   '360deg']  });
  const spin2 = rot2.interpolate({ inputRange: [0, 1], outputRange: ['0deg',  '-360deg']  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── Büyük merkez sembolü ── */}
      <View style={ss.centerWrap}>
        <Animated.View style={{ opacity: breath, transform: [{ rotate: spin1 }] }}>
          <AyYildiz size={310} />
        </Animated.View>
      </View>

      {/* ── Küçük sağ alt sembolü ── */}
      <Animated.View style={[ss.corner, { opacity: 0.05, transform: [{ rotate: spin2 }] }]}>
        <AyYildiz size={190} />
      </Animated.View>
    </View>
  );
};

const ss = StyleSheet.create({
  centerWrap: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    bottom: 60,
    right: -50,
  },
});

export default AdminSymbol;
