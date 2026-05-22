import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

// ─── K geometrisi (80×80 viewBox) ────────────────────────────
const VB       = 80;
const CX       = 18;   // dikey çubuk X
const CY_TOP   = 8;
const CY_MID   = 40;   // kesişim
const CY_BOT   = 72;
const RX       = 66;   // diyagonal sağ uç

const LEN_VERT = CY_BOT - CY_TOP;                                        // 64
const LEN_DIAG = Math.hypot(RX - CX, CY_MID - CY_TOP);                  // ≈ 57.7

const COLOR_SELLER   = colors.primary;   // indigo — satıcı
const COLOR_CONSUMER = '#0EA5E9';        // sky — müşteri
const STROKE_W       = 5;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath   = Animated.createAnimatedComponent(Path);

// ─── Nokta bileşeni (SVG içinde hareket eden daire) ──────────
function TravelDot({ prog, fromX, fromY, toX, toY, fill }) {
  const cx = prog.interpolate({ inputRange: [0, 1], outputRange: [fromX, toX] });
  const cy = prog.interpolate({ inputRange: [0, 1], outputRange: [fromY, toY] });
  const op = prog.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 1, 1, 0] });

  return <AnimatedCircle cx={cx} cy={cy} r={4.5} fill={fill} opacity={op} />;
}

// ─── Çizilen yol bileşeni ─────────────────────────────────────
function DrawPath({ prog, d, length, stroke }) {
  const offset = prog.interpolate({ inputRange: [0, 1], outputRange: [length, 0] });
  const op     = prog.interpolate({ inputRange: [0, 0.01, 1],  outputRange: [0, 1, 1] });

  return (
    <AnimatedPath
      d={d}
      stroke={stroke}
      strokeWidth={STROKE_W}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={length}
      strokeDashoffset={offset}
      opacity={op}
    />
  );
}

// ─── Ana bileşen ─────────────────────────────────────────────
export default function KLogoAnimation({ size = 120, style, onComplete }) {
  // Faz 0: noktalar yolculuk eder (0–900ms)
  const sellerProg   = useRef(new Animated.Value(0)).current;
  const consumerProg = useRef(new Animated.Value(0)).current;

  // Faz 1: pulse halkası (900–1100ms)
  const pulseR       = useRef(new Animated.Value(0)).current;
  const pulseOp      = useRef(new Animated.Value(0)).current;

  // Faz 2: çizgiler draw-in (1100–2000ms)
  const vertProg     = useRef(new Animated.Value(0)).current;
  const upperProg    = useRef(new Animated.Value(0)).current;
  const lowerProg    = useRef(new Animated.Value(0)).current;

  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Faz 0 — seyahat
    Animated.parallel([
      Animated.timing(sellerProg,   { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.timing(consumerProg, { toValue: 1, duration: 900, useNativeDriver: false }),
    ]).start(() => {

      // Faz 1 — pulse halkası
      setShowPulse(true);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseOp, { toValue: 0.7, duration: 80,  useNativeDriver: false }),
          Animated.timing(pulseOp, { toValue: 0,   duration: 300, useNativeDriver: false }),
        ]),
        Animated.timing(pulseR, { toValue: 14, duration: 380, useNativeDriver: false }),
      ]).start(() => {

        // Faz 2 — K çizgileri
        Animated.stagger(100, [
          Animated.timing(vertProg,  { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(upperProg, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(lowerProg, { toValue: 1, duration: 400, useNativeDriver: false }),
        ]).start(() => {
          onComplete?.();
        });
      });
    });
  }, []);

  return (
    <View style={[st.wrap, { width: size, height: size }, style]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VB} ${VB}`}
      >
        {/* ── K çizgileri ── */}
        <DrawPath
          prog={vertProg}
          d={`M ${CX} ${CY_TOP} L ${CX} ${CY_BOT}`}
          length={LEN_VERT}
          stroke={COLOR_STROKE}
        />
        <DrawPath
          prog={upperProg}
          d={`M ${CX} ${CY_MID} L ${RX} ${CY_TOP}`}
          length={LEN_DIAG}
          stroke={COLOR_SELLER}
        />
        <DrawPath
          prog={lowerProg}
          d={`M ${CX} ${CY_MID} L ${RX} ${CY_BOT}`}
          length={LEN_DIAG}
          stroke={COLOR_CONSUMER}
        />

        {/* ── Pulse halkası ── */}
        {showPulse && (
          <AnimatedCircle
            cx={CX}
            cy={CY_MID}
            r={pulseR}
            fill="none"
            stroke={COLOR_SELLER}
            strokeWidth={1.5}
            opacity={pulseOp}
          />
        )}

        {/* ── Seyahat eden noktalar ── */}
        <TravelDot
          prog={sellerProg}
          fromX={RX}   fromY={CY_TOP}
          toX={CX}     toY={CY_MID}
          fill={COLOR_SELLER}
        />
        <TravelDot
          prog={consumerProg}
          fromX={RX}   fromY={CY_BOT}
          toX={CX}     toY={CY_MID}
          fill={COLOR_CONSUMER}
        />
      </Svg>
    </View>
  );
}

const COLOR_STROKE = colors.primary;

const st = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
