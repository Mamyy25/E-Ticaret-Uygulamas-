import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import AuroraBackground from '../components/AuroraBackground';
import ShimmerLogo from '../components/ShimmerLogo';
import Button from '../components/Button';
import AnimatedGradientBorder from '../components/AnimatedGradientBorder';

const { height: H, width: W } = Dimensions.get('window');

// ─── Animasyonlu input ────────────────────────────────────────
function AnimInput({ label, icon, error, entryAnim, rightIcon, onRightIcon, ...props }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [error ? colors.danger : colors.borderSubtle, colors.primary],
  });

  return (
    <Animated.View
      style={[
        s.inputGroup,
        entryAnim && {
          opacity: entryAnim,
          transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      <Text style={s.inputLabel}>{label}</Text>
      <Animated.View style={[s.inputBox, { borderColor }]}>
        <Ionicons
          name={icon}
          size={18}
          color={focused ? colors.primary : colors.textMuted}
        />
        <TextInput
          style={s.inputField}
          placeholderTextColor={colors.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIcon} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? <Text style={s.inputError}>{error}</Text> : null}
    </Animated.View>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const { login }  = useContext(AuthContext);
  const insets     = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Giriş animasyonları
  const topFade  = useRef(new Animated.Value(0)).current;
  const topY     = useRef(new Animated.Value(-50)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(80)).current;
  const f1Anim   = useRef(new Animated.Value(0)).current;
  const f2Anim   = useRef(new Animated.Value(0)).current;
  const btnAnim  = useRef(new Animated.Value(0)).current;
  const shakeX   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(topY,   { toValue: 0, friction: 7, tension: 55, useNativeDriver: true }),
        Animated.timing(topFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardY,   { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.stagger(90, [
        Animated.spring(f1Anim,  { toValue: 1, friction: 7, useNativeDriver: true }),
        Animated.spring(f2Anim,  { toValue: 1, friction: 7, useNativeDriver: true }),
        Animated.spring(btnAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const shake = () =>
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:   7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:   0, duration: 55, useNativeDriver: true }),
    ]).start();

  const handleLogin = async () => {
    if (!email || !password) { setError('E-posta ve şifre zorunludur.'); shake(); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message || 'E-posta veya şifre hatalı.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <AuroraBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <View
            style={[
              s.root,
              { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[4] },
            ]}
          >
            {/* ── Üst alan: branding ── */}
            <Animated.View
              style={[s.topArea, { opacity: topFade, transform: [{ translateY: topY }] }]}
            >
              {/* Dekoratif glow halkası */}
              <View style={s.glowRing} />

              <ShimmerLogo text="Kairos" size={fontSize.xl3} />
              <Text style={s.tagline}>Doğru kişi. Doğru an.</Text>

              {/* Mini özellik chipler */}
              <View style={s.chipRow}>
                {['Hizmet Bul', 'Dijital Ürün', 'Rezervasyon'].map(c => (
                  <View key={c} style={s.chip}>
                    <Text style={s.chipTxt}>{c}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* ── Form kartı ── */}
            <Animated.View
              style={[
                s.cardWrap,
                {
                  opacity: cardFade,
                  transform: [{ translateY: cardY }, { translateX: shakeX }],
                },
              ]}
            >
              <AnimatedGradientBorder
                borderWidth={1.5}
                borderRadius={radius.xl2}
                duration={3200}
                glowOpacity={0.3}
                contentStyle={s.cardContent}
              >
                <Text style={s.cardTitle}>Giriş Yap</Text>

                {/* Hata banner */}
                {!!error && (
                  <View style={s.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                    <Text style={s.errorTxt}>{error}</Text>
                  </View>
                )}

                <AnimInput
                  label="E-Posta"
                  icon="mail-outline"
                  placeholder="adres@ornek.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  entryAnim={f1Anim}
                />

                <View style={{ height: space[3] }} />

                <AnimInput
                  label="Şifre"
                  icon="lock-closed-outline"
                  placeholder="••••••••"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                  entryAnim={f2Anim}
                  rightIcon={showPw ? 'eye-off-outline' : 'eye-outline'}
                  onRightIcon={() => setShowPw(v => !v)}
                />

                <Animated.View
                  style={{
                    opacity: btnAnim,
                    transform: [{ translateY: btnAnim.interpolate({ inputRange: [0,1], outputRange: [10, 0] }) }],
                    marginTop: space[5],
                    gap: space[3],
                  }}
                >
                  <Button
                    label={loading ? '' : 'Giriş Yap →'}
                    loading={loading}
                    onPress={handleLogin}
                    variant="primary"
                    size="lg"
                    fullWidth
                  />

                  <TouchableOpacity
                    style={s.registerRow}
                    onPress={() => navigation.navigate('KayitOl')}
                    activeOpacity={0.7}
                  >
                    <Text style={s.registerTxt}>
                      Hesabın yok mu?{'  '}
                      <Text style={s.registerLink}>Kayıt Ol →</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </AnimatedGradientBorder>
            </Animated.View>

          </View>
        </KeyboardAvoidingView>
      </AuroraBackground>
    </>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space[5],
    justifyContent: 'center',
    gap: space[6],
  },

  // Üst alan
  topArea: {
    alignItems: 'center',
    gap: space[3],
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(70,72,212,0.06)',
    top: -60,
    alignSelf: 'center',
  },
  tagline: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  chipRow: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[1],
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBg,
  },
  chipTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },

  // Kart
  cardWrap: { width: '100%' },
  cardContent: {
    padding: space[6],
    gap: 0,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: space[5],
  },

  // Hata
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.2)',
    borderRadius: radius.lg,
    padding: space[3],
    marginBottom: space[4],
  },
  errorTxt: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.danger,
    flex: 1,
  },

  // Input
  inputGroup: { gap: space[1] + 1 },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    gap: space[3],
  },
  inputField: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.text,
    padding: 0,
  },
  inputError: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: 2,
  },

  // Alt link
  registerRow: { alignItems: 'center' },
  registerTxt: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  registerLink: {
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
});
