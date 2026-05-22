import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import AuroraBackground from '../components/AuroraBackground';
import ShimmerLogo from '../components/ShimmerLogo';
import Button from '../components/Button';

const { width: W } = Dimensions.get('window');

const USER_TYPES = [
  {
    value: 'Consumer',
    icon:  'bag-handle-outline',
    label: 'Tüketici',
    desc:  'Hizmet ve ürün satın al',
    color: colors.primary,
    bg:    colors.primarySoft,
  },
  {
    value: 'LocalArtisan',
    icon:  'construct-outline',
    label: 'Yerel Esnaf',
    desc:  'Yerelde hizmet ver',
    color: colors.success,
    bg:    colors.successSoft,
  },
  {
    value: 'OnlineServiceProvider',
    icon:  'laptop-outline',
    label: 'Online Uzman',
    desc:  'Koçluk, eğitim, danışmanlık',
    color: colors.info,
    bg:    colors.infoSoft,
  },
  {
    value: 'Seller',
    icon:  'storefront-outline',
    label: 'Satıcı',
    desc:  'Ürün satışı yap',
    color: colors.warning,
    bg:    colors.warningSoft,
  },
];

// ─── Adım göstergesi ──────────────────────────────────────────
function StepDots({ step }) {
  return (
    <View style={s.dots}>
      {[0, 1].map(i => (
        <Animated.View
          key={i}
          style={[
            s.dot,
            i === step && s.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Tip kartı ────────────────────────────────────────────────
function TypeCard({ item, selected, onSelect }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, item.color],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, item.bg],
  });

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 4 }).start()}
      onPress={onSelect}
      style={{ width: '48%' }}
    >
      <Animated.View style={[s.typeCard, { borderColor, backgroundColor: bgColor, transform: [{ scale }] }]}>
        <View style={[s.typeIconWrap, { backgroundColor: selected ? item.bg : colors.surfaceRaised }]}>
          <Ionicons name={item.icon} size={22} color={selected ? item.color : colors.textMuted} />
        </View>
        <Text style={[s.typeLabel, selected && { color: item.color }]}>{item.label}</Text>
        <Text style={s.typeDesc}>{item.desc}</Text>
        {selected && (
          <View style={[s.typeCheck, { backgroundColor: item.color }]}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Animasyonlu input ────────────────────────────────────────
function FormInput({ label, icon, anim, error, secureEntry, showToggle, onToggle, ...props }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.danger : colors.border, colors.primary],
  });

  return (
    <Animated.View style={[
      s.inputWrap,
      anim && {
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [12,0] }) }],
      },
    ]}>
      {label && <Text style={s.inputLabel}>{label}</Text>}
      <Animated.View style={[s.inputBox, { borderColor }]}>
        {icon && (
          <Ionicons name={icon} size={17} color={focused ? colors.primary : colors.textMuted} style={{ marginRight: 2 }} />
        )}
        <TextInput
          style={s.inputField}
          placeholderTextColor={colors.textMuted}
          onFocus={() => {
            setFocused(true);
            Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
          }}
          onBlur={() => {
            setFocused(false);
            Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
          }}
          secureTextEntry={secureEntry}
          {...props}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
            <Ionicons name={secureEntry ? 'eye-outline' : 'eye-off-outline'} size={17} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? <Text style={s.inputError}>{error}</Text> : null}
    </Animated.View>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const insets       = useSafeAreaInsets();

  const [step, setStep]                   = useState(0);
  const [userType, setUserType]           = useState('Consumer');
  const [fullName, setFullName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [errors, setErrors]               = useState({});
  const [loading, setLoading]             = useState(false);

  // Ekran giriş animasyonu
  const brandFade = useRef(new Animated.Value(0)).current;
  const brandY    = useRef(new Animated.Value(-30)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardY     = useRef(new Animated.Value(50)).current;

  // Adım geçiş animasyonu
  const stepSlide = useRef(new Animated.Value(0)).current;

  // Form alanları animasyonları
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(brandY,    { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(brandFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.spring(cardY,    { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
          Animated.timing(cardFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  // Adım 2'ye geçince alanları animasyonla aç
  const openFormFields = () => {
    anims.forEach(a => a.setValue(0));
    Animated.stagger(70, anims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: true })
    )).start();
  };

  const goToStep2 = () => {
    // Kart sola kayar
    Animated.timing(stepSlide, { toValue: -W, duration: 280, useNativeDriver: true }).start(() => {
      setStep(1);
      stepSlide.setValue(W);
      Animated.spring(stepSlide, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }).start();
      openFormFields();
    });
  };

  const goBack = () => {
    Animated.timing(stepSlide, { toValue: W, duration: 260, useNativeDriver: true }).start(() => {
      setStep(0);
      stepSlide.setValue(-W);
      Animated.spring(stepSlide, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }).start();
    });
  };

  const validate = () => {
    const e = {};
    if (!fullName.trim())              e.fullName  = 'Ad soyad zorunlu';
    if (!email.trim())                 e.email     = 'E-posta zorunlu';
    if (password.length < 6)           e.password  = 'En az 6 karakter';
    if (password !== confirmPw)        e.confirmPw = 'Şifreler eşleşmiyor';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register(fullName, email, password, confirmPw, userType);
      if (result?.isPending) {
        navigation.navigate('GirisYap');
      } else if (result?.success) {
        navigation.navigate('GirisYap');
      }
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.root, { paddingTop: insets.top + space[6], paddingBottom: insets.bottom + space[6] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Branding ── */}
          <Animated.View style={[s.brand, { opacity: brandFade, transform: [{ translateY: brandY }] }]}>
            <ShimmerLogo text="Kairos" size={fontSize.xl2} />
            <Text style={s.brandSub}>
              {step === 0 ? 'Hesabını nasıl kullanacaksın?' : 'Hesap bilgilerini gir'}
            </Text>
            <StepDots step={step} />
          </Animated.View>

          {/* ── Kart ── */}
          <Animated.View style={[s.card, { opacity: cardFade, transform: [{ translateY: cardY }] }]}>
            <Animated.View style={{ transform: [{ translateX: stepSlide }] }}>

              {step === 0 ? (
                /* ─── Adım 1: Hesap türü ─── */
                <View style={{ gap: space[5] }}>
                  <View style={s.typeGrid}>
                    {USER_TYPES.map(t => (
                      <TypeCard
                        key={t.value}
                        item={t}
                        selected={userType === t.value}
                        onSelect={() => setUserType(t.value)}
                      />
                    ))}
                  </View>

                  <Button
                    label="Devam Et →"
                    onPress={goToStep2}
                    variant="primary"
                    size="lg"
                    fullWidth
                  />

                  <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('GirisYap')} activeOpacity={0.7}>
                    <Text style={s.loginTxt}>
                      Zaten hesabın var mı?{' '}
                      <Text style={s.loginBold}>Giriş Yap →</Text>
                    </Text>
                  </TouchableOpacity>
                </View>

              ) : (
                /* ─── Adım 2: Bilgiler ─── */
                <View style={{ gap: space[4] }}>
                  {/* Geri butonu */}
                  <TouchableOpacity style={s.backBtn} onPress={goBack} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={18} color={colors.primary} />
                    <Text style={s.backTxt}>Geri</Text>
                  </TouchableOpacity>

                  {/* Seçilen hesap türü rozeti */}
                  {(() => {
                    const t = USER_TYPES.find(x => x.value === userType);
                    return (
                      <View style={[s.selectedTypeBadge, { backgroundColor: t.bg, borderColor: t.color + '30' }]}>
                        <Ionicons name={t.icon} size={14} color={t.color} />
                        <Text style={[s.selectedTypeLabel, { color: t.color }]}>{t.label}</Text>
                      </View>
                    );
                  })()}

                  {errors.general && (
                    <View style={s.errorBanner}>
                      <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                      <Text style={s.errorTxt}>{errors.general}</Text>
                    </View>
                  )}

                  <FormInput
                    label="Ad Soyad"
                    icon="person-outline"
                    placeholder="Adınız Soyadınız"
                    autoCapitalize="words"
                    value={fullName}
                    onChangeText={setFullName}
                    anim={anims[0]}
                    error={errors.fullName}
                  />
                  <FormInput
                    label="E-Posta"
                    icon="mail-outline"
                    placeholder="adres@ornek.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    anim={anims[1]}
                    error={errors.email}
                  />
                  <FormInput
                    label="Şifre"
                    icon="lock-closed-outline"
                    placeholder="••••••••"
                    secureEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                    anim={anims[2]}
                    error={errors.password}
                    showToggle
                    onToggle={() => setShowPw(v => !v)}
                  />
                  <FormInput
                    label="Şifre Tekrar"
                    icon="lock-closed-outline"
                    placeholder="••••••••"
                    secureEntry={!showConfirm}
                    value={confirmPw}
                    onChangeText={setConfirmPw}
                    anim={anims[3]}
                    error={errors.confirmPw}
                    showToggle
                    onToggle={() => setShowConfirm(v => !v)}
                  />

                  <Animated.View style={{ opacity: anims[3], marginTop: space[2] }}>
                    <Button
                      label="Kayıt Ol"
                      loading={loading}
                      onPress={handleRegister}
                      variant="primary"
                      size="lg"
                      fullWidth
                    />
                  </Animated.View>
                </View>
              )}

            </Animated.View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </AuroraBackground>
  );
}

const s = StyleSheet.create({
  root: {
    flexGrow: 1,
    paddingHorizontal: space[5],
    gap: space[5],
    alignItems: 'center',
  },

  // Branding
  brand:     { alignItems: 'center', gap: space[2] },
  brandSub:  { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textSecondary },

  // Step dots
  dots:      { flexDirection: 'row', gap: space[2], marginTop: space[2] },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderStrong },
  dotActive: { width: 18, backgroundColor: colors.primary, borderRadius: 3 },

  // Kart
  card: {
    width: '100%',
    backgroundColor: colors.glassBg,
    borderRadius: radius.xl2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: space[5],
    overflow: 'hidden',
  },

  // Tip kartları
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], justifyContent: 'space-between' },
  typeCard: {
    padding: space[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: space[2],
    position: 'relative',
  },
  typeIconWrap: {
    width: 44, height: 44, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  typeLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  typeDesc:  { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, textAlign: 'center', lineHeight: 14 },
  typeCheck: {
    position: 'absolute', top: space[2], right: space[2],
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  // Form
  inputWrap:  { gap: space[1] + 1 },
  inputLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textSecondary },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    gap: space[3],
  },
  inputField: {
    flex: 1, fontFamily: fonts.body, fontSize: fontSize.base, color: colors.text, padding: 0,
  },
  inputError: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.danger },

  // Geri
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },

  // Seçilen tip rozeti
  selectedTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: space[3],
    borderRadius: radius.pill, borderWidth: 1,
  },
  selectedTypeLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },

  // Hata
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: 'rgba(186,26,26,0.2)',
    borderRadius: radius.lg, padding: space[3],
  },
  errorTxt: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.danger, flex: 1 },

  // Giriş linki
  loginLink: { alignItems: 'center', marginTop: space[2] },
  loginTxt:  { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary },
  loginBold: { fontFamily: fonts.bodySemiBold, color: colors.primary },
});
