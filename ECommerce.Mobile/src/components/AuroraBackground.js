import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

// Açık mavi-beyaz aurora — sky/cobalt tonları
const BLOBS = [
  {
    // Sol üst — cobalt blue
    colors: ['rgba(37,99,235,0.11)', 'rgba(37,99,235,0)'],
    size: W * 0.95,
    startX: -W * 0.28,
    startY: -W * 0.18,
    driftX: 20,
    driftY: 14,
    duration: 14000,
  },
  {
    // Sağ üst — sky blue
    colors: ['rgba(14,165,233,0.09)', 'rgba(14,165,233,0)'],
    size: W * 0.88,
    startX: W * 0.38,
    startY: -W * 0.22,
    driftX: -16,
    driftY: 18,
    duration: 18000,
  },
  {
    // Orta sol — açık mavi
    colors: ['rgba(59,130,246,0.08)', 'rgba(59,130,246,0)'],
    size: W * 0.78,
    startX: -W * 0.12,
    startY: H * 0.22,
    driftX: 22,
    driftY: -12,
    duration: 16000,
  },
  {
    // Sağ alt — ice blue
    colors: ['rgba(56,189,248,0.07)', 'rgba(56,189,248,0)'],
    size: W * 0.82,
    startX: W * 0.42,
    startY: H * 0.38,
    driftX: -18,
    driftY: -16,
    duration: 20000,
  },
];

function AuroraBlob({ blob }) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animX = Animated.loop(
      Animated.sequence([
        Animated.timing(tx, { toValue: blob.driftX, duration: blob.duration,        useNativeDriver: true }),
        Animated.timing(tx, { toValue: 0,           duration: blob.duration,        useNativeDriver: true }),
      ])
    );
    const animY = Animated.loop(
      Animated.sequence([
        Animated.timing(ty, { toValue: blob.driftY, duration: blob.duration * 1.15, useNativeDriver: true }),
        Animated.timing(ty, { toValue: 0,           duration: blob.duration * 1.15, useNativeDriver: true }),
      ])
    );
    animX.start();
    animY.start();
    return () => { animX.stop(); animY.stop(); };
  }, []);

  return (
    <Animated.View
      style={[
        st.blob,
        {
          width: blob.size,
          height: blob.size,
          borderRadius: blob.size / 2,
          left: blob.startX,
          top: blob.startY,
          transform: [{ translateX: tx }, { translateY: ty }],
        },
      ]}
    >
      <LinearGradient
        colors={blob.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

export default function AuroraBackground({ children, style }) {
  return (
    <View style={[st.root, style]}>
      {/* Zemin: beyaz → çok hafif mavi-beyaz */}
      <LinearGradient
        colors={['#F0F7FF', '#EEF4FF', '#F5F9FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {BLOBS.map((blob, i) => (
        <AuroraBlob key={i} blob={blob} />
      ))}
      <View style={st.content}>{children}</View>
    </View>
  );
}

const st = StyleSheet.create({
  root:    { flex: 1, overflow: 'hidden' },
  blob:    { position: 'absolute', overflow: 'hidden' },
  content: { flex: 1, zIndex: 10 },
});
