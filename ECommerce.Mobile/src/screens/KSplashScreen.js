import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuroraBackground from '../components/AuroraBackground';
import KLogoAnimation from '../components/KLogoAnimation';
import ShimmerLogo from '../components/ShimmerLogo';
import { colors } from '../theme/colors';
import { fonts, fontSize } from '../theme/typography';

const { height: H } = Dimensions.get('window');

// onFinish: splash tamamlanınca çağrılır
export default function KSplashScreen({ onFinish }) {
  const insets      = useSafeAreaInsets();
  const [kDone, setKDone] = useState(false);

  // Logo fade-in
  const logoFade    = useRef(new Animated.Value(0)).current;
  // Tagline fade-in
  const tagFade     = useRef(new Animated.Value(0)).current;
  const tagSlide    = useRef(new Animated.Value(12)).current;
  // Tüm ekranın fade-out'u
  const screenFade  = useRef(new Animated.Value(1)).current;

  const handleKComplete = () => {
    setKDone(true);

    // ShimmerLogo + tagline birlikte açılır
    Animated.parallel([
      Animated.timing(logoFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(tagFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(tagSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => {
      // 900ms bekle, sonra tüm ekran fade-out
      setTimeout(() => {
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => onFinish?.());
      }, 900);
    });
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: screenFade }]}>
      <AuroraBackground>
        <View style={[styles.root, { paddingTop: insets.top }]}>
          {/* K Animasyonu */}
          {!kDone && (
            <KLogoAnimation size={110} onComplete={handleKComplete} />
          )}

          {/* ShimmerLogo (K bitince overlay olarak görünür) */}
          <Animated.View style={[styles.logoWrap, { opacity: logoFade }]}>
            <ShimmerLogo text="Kairos" size={fontSize.xl3 + 4} />
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              { opacity: tagFade, transform: [{ translateY: tagSlide }] },
            ]}
          >
            Her çözümün tam zamanı.
          </Animated.Text>
        </View>
      </AuroraBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoWrap: {
    position: 'absolute',
  },
  tagline: {
    marginTop: 90,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.base,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
