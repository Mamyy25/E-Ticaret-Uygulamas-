import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet,
  Animated, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';
import AuroraBackground from '../components/AuroraBackground';
import ShimmerLogo from '../components/ShimmerLogo';

import { API_BASE } from '../config';
const API = API_BASE;
const { width: W, height: H } = Dimensions.get('window');
const CARD_W = (W - space[5] * 2 - space[3]) / 2;

const WORDS = ['sorununu', 'ihtiyacını', 'projeni', 'işini', 'hizmetini', 'hayalini'];

const FEATURES = [
  { icon: 'search-outline',    label: 'Hizmet Bul',    desc: 'Yerel uzmanları keşfet',  color: colors.primary, bg: colors.primarySoft },
  { icon: 'cube-outline',      label: 'Dijital Ürün',  desc: 'Hazır içerikler al',      color: colors.info,    bg: colors.infoSoft },
  { icon: 'calendar-outline',  label: 'Rezervasyon',   desc: 'Anında randevu al',       color: colors.success, bg: colors.successSoft },
  { icon: 'bar-chart-outline', label: 'SaaS Araçları', desc: 'İşini yönet, büyüt',      color: colors.warning, bg: colors.warningSoft },
];

const HOW_TABS = {
  buyer: {
    icon: 'person-outline',
    title: 'Alıcı için',
    subtitle: 'Hizmeti bul, randevunu al',
    accent: colors.primary,
    accentSoft: colors.primarySoft,
    steps: [
      { icon: 'search-outline',   title: 'Ara',   desc: 'Hizmet, ürün veya esnaf ara' },
      { icon: 'checkmark-circle-outline', title: 'Seç', desc: 'Profilleri incele, karşılaştır' },
      { icon: 'flash-outline',    title: 'Ulaş',  desc: 'Randevu al veya satın al' },
    ],
  },
  seller: {
    icon: 'storefront-outline',
    title: 'Satıcı için',
    subtitle: 'Listele, kazan, büyü',
    accent: '#0EA5E9',
    accentSoft: 'rgba(14,165,233,0.08)',
    steps: [
      { icon: 'add-circle-outline',    title: 'Listele', desc: 'Hizmet ya da ürünlerini ekle' },
      { icon: 'cash-outline',          title: 'Kazan',   desc: 'Siparişleri yönet, öde al' },
      { icon: 'trending-up-outline',   title: 'Büyü',    desc: 'Müşteri ağını genişlet' },
    ],
  },
};

// ─── Yardımcı: Scroll ile açılan animasyon ───────────────────
function useScrollReveal() {
  const anim = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);
  const reveal = () => {
    if (triggered.current) return;
    triggered.current = true;
    Animated.spring(anim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
  };
  const style = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  };
  return { reveal, style };
}

// ─── WordRotate ───────────────────────────────────────────────
function WordRotate() {
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const tY   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0,  duration: 180, useNativeDriver: true }),
        Animated.timing(tY,   { toValue: -8, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % WORDS.length);
        tY.setValue(8);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(tY,   { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start();
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return <Animated.Text style={[s.heroAccent, { opacity: fade, transform: [{ translateY: tY }] }]}>{WORDS[idx]}</Animated.Text>;
}

// ─── Nasıl Çalışır Kartı ─────────────────────────────────────
function HowItWorksSection() {
  const [tab, setTab]   = useState('buyer');
  const cardAnim        = useRef(new Animated.Value(1)).current;
  const slideAnim       = useRef(new Animated.Value(0)).current;
  const [current, setCurrent] = useState('buyer');
  const tabBarW         = W - space[5] * 2;
  const pillX           = useRef(new Animated.Value(0)).current;

  const switchTab = (next) => {
    if (next === tab) return;
    const dir = next === 'seller' ? 1 : -1;

    // Tab göstergesi kayar
    Animated.spring(pillX, {
      toValue: next === 'buyer' ? 0 : tabBarW / 2,
      useNativeDriver: true, friction: 8, tension: 80,
    }).start();

    // Kart çıkış → içerik değişimi → giriş
    Animated.parallel([
      Animated.timing(cardAnim,  { toValue: 0,       duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30 * dir, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(next);
      setTab(next);
      slideAnim.setValue(30 * dir);
      Animated.parallel([
        Animated.spring(cardAnim,  { toValue: 1, friction: 7, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]).start();
    });
  };

  const data = HOW_TABS[current];

  return (
    <View style={{ gap: space[4] }}>
      <SectionHeader title="Nasıl çalışır?" />

      {/* Segmented control */}
      <View style={s.segWrap}>
        {/* Kayan pill */}
        <Animated.View
          style={[
            s.segPill,
            { width: tabBarW / 2 - 4, transform: [{ translateX: pillX }] },
          ]}
        />
        {['buyer', 'seller'].map((t) => (
          <Pressable key={t} style={s.segBtn} onPress={() => switchTab(t)}>
            <Ionicons
              name={HOW_TABS[t].icon}
              size={15}
              color={tab === t ? colors.primary : colors.textMuted}
              style={{ marginRight: 5 }}
            />
            <Text style={[s.segTxt, tab === t && s.segTxtActive]}>
              {t === 'buyer' ? 'Alıcı' : 'Satıcı'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Glass kart */}
      <Animated.View style={{ opacity: cardAnim, transform: [{ translateX: slideAnim }] }}>
        <View style={[s.howCard, { borderTopColor: data.accent, borderTopWidth: 2 }]}>
          {/* Kart başlığı */}
          <LinearGradient
            colors={[data.accentSoft, 'transparent']}
            style={s.howCardGradient}
          />
          <View style={s.howCardHeader}>
            <View style={[s.howCardIconWrap, { backgroundColor: data.accentSoft }]}>
              <Ionicons name={data.icon} size={20} color={data.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.howCardTitle}>{data.title}</Text>
              <Text style={s.howCardSub}>{data.subtitle}</Text>
            </View>
          </View>

          {/* Adımlar */}
          <View style={s.howSteps}>
            {data.steps.map((step, i) => (
              <View key={step.title} style={s.howStep}>
                <View style={s.howStepLeft}>
                  <View style={[s.howStepBubble, { backgroundColor: data.accentSoft, borderColor: data.accent + '40' }]}>
                    <Text style={[s.howStepNo, { color: data.accent }]}>{i + 1}</Text>
                  </View>
                  {i < data.steps.length - 1 && <View style={[s.howStepLine, { backgroundColor: data.accent + '25' }]} />}
                </View>
                <View style={s.howStepBody}>
                  <View style={s.howStepTitleRow}>
                    <Ionicons name={step.icon} size={15} color={data.accent} />
                    <Text style={s.howStepTitle}>{step.title}</Text>
                  </View>
                  <Text style={s.howStepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Feature Card (basılabilir) ───────────────────────────────
function FeatureCard({ item }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 4 }).start()}
    >
      <Animated.View style={[s.featureCard, { transform: [{ scale }] }]}>
        <View style={[s.featureIcon, { backgroundColor: item.bg }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <Text style={s.featureLabel}>{item.label}</Text>
        <Text style={s.featureDesc}>{item.desc}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── CTA Section ─────────────────────────────────────────────
function CTASection({ navigation }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.ctaCard}>
      {/* Gradient arka plan */}
      <LinearGradient
        colors={['rgba(70,72,212,0.07)', 'rgba(14,165,233,0.05)', 'rgba(70,72,212,0.09)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Pulsing arka plan dairesi */}
      <Animated.View style={[s.ctaGlow, { transform: [{ scale: pulse }] }]} />

      {/* İçerik */}
      <View style={s.ctaBadge}>
        <View style={s.ctaBadgeDot} />
        <Text style={s.ctaBadgeTxt}>Ücretsiz · Hızlı kurulum</Text>
      </View>

      <Text style={s.ctaHeadline}>Doğru kişi.{'\n'}Doğru an.</Text>
      <Text style={s.ctaBody}>
        Kairos'a katıl. Hizmet ver, ürün sat ya da ihtiyacını bul.
      </Text>

      {/* Sosyal kanıt */}
      <View style={s.ctaProof}>
        <View style={s.ctaAvatars}>
          {['#4648D4', '#0EA5E9', '#15803D', '#B45309'].map((c, i) => (
            <View key={i} style={[s.ctaAvatar, { backgroundColor: c, marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }]}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 9, color: '#fff' }}>
                {['K', 'M', 'A', '+'][i]}
              </Text>
            </View>
          ))}
        </View>
        <Text style={s.ctaProofTxt}>1.200+ kişi bu ay katıldı</Text>
      </View>

      {/* Butonlar */}
      <View style={s.ctaButtons}>
        <Button
          label="Ücretsiz Başla →"
          onPress={() => navigation.navigate('KayitOl')}
          variant="primary" size="lg"
          style={{ flex: 1 }}
        />
        <Button
          label="Keşfet"
          onPress={() => navigation.navigate('Kesfet')}
          variant="secondary" size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

// ─── Misafir Landing ──────────────────────────────────────────
function GuestLanding({ navigation }) {
  const scrollRef  = useRef(null);
  const scrollY    = useRef(new Animated.Value(0)).current;

  // Snap offset'leri onLayout ile topla
  const [snapOffsets, setSnapOffsets] = useState([0]);
  const registerSnap = (e) => {
    const y = Math.round(e.nativeEvent.layout.y);
    if (y === 0) return;
    setSnapOffsets(prev => {
      const merged = [...new Set([...prev, y])].sort((a, b) => a - b);
      return merged;
    });
  };

  // Scroll reveal animasyonları
  const featuresReveal  = useScrollReveal();
  const howReveal       = useScrollReveal();
  const ctaReveal       = useScrollReveal();
  const sectionRefs     = {
    features:  useRef(0),
    howItWorks: useRef(0),
    cta:       useRef(0),
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (e) => {
        const y = e.nativeEvent.contentOffset.y;
        const vh = e.nativeEvent.layoutMeasurement.height;
        if (y + vh > sectionRefs.features.current  + 60) featuresReveal.reveal();
        if (y + vh > sectionRefs.howItWorks.current + 60) howReveal.reveal();
        if (y + vh > sectionRefs.cta.current        + 60) ctaReveal.reveal();
      },
    }
  );

  return (
    <AuroraBackground>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <View style={s.logoArea}>
            <ShimmerLogo text="Kairos" size={fontSize.xl3} />
          </View>

          <Text style={s.heroTitle}>Platformun</Text>
          <WordRotate />
          <Text style={s.heroTitle}>çözüyor</Text>

          <Text style={s.heroSub}>
            Türkiye'nin hizmet ve yetenek platformu. Yerel ustalar, online uzmanlar, dijital içerikler — tek çatı altında.
          </Text>

          <View style={s.ctaRow}>
            <Button label="Hizmet Keşfet"  onPress={() => navigation.navigate('Kesfet')}   variant="primary"   size="lg" style={{ flex: 1 }} />
            <Button label="Ücretsiz Başla" onPress={() => navigation.navigate('KayitOl')} variant="secondary" size="lg" style={{ flex: 1 }} />
          </View>

          <View style={s.statsRow}>
            {[['5+', 'Kullanıcı'], ['∞', 'Dijital Ürün'], ['7/24', 'Çevrimiçi']].map(([val, lbl]) => (
              <View key={lbl} style={s.statChip}>
                <Text style={s.statVal}>{val}</Text>
                <Text style={s.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Özellikler ── */}
        <Animated.View
          style={[s.section, featuresReveal.style]}
          onLayout={(e) => {
            sectionRefs.features.current = e.nativeEvent.layout.y;
            registerSnap(e);
          }}
        >
          <SectionHeader title="Ne sunuyoruz?" />
          <View style={s.featuresGrid}>
            {FEATURES.map((f) => <FeatureCard key={f.label} item={f} />)}
          </View>
        </Animated.View>

        {/* ── Nasıl Çalışır ── */}
        <Animated.View
          style={[s.section, howReveal.style]}
          onLayout={(e) => {
            sectionRefs.howItWorks.current = e.nativeEvent.layout.y;
            registerSnap(e);
          }}
        >
          <HowItWorksSection />
        </Animated.View>

        {/* ── CTA ── */}
        <Animated.View
          style={[s.ctaOuter, ctaReveal.style]}
          onLayout={(e) => { sectionRefs.cta.current = e.nativeEvent.layout.y; }}
        >
          <CTASection navigation={navigation} />
        </Animated.View>

        <View style={{ height: space[12] }} />
      </ScrollView>
    </AuroraBackground>
  );
}

// ─── Randevu durum config ─────────────────────────────────────
const APPT_STATUS = {
  Pending:   { label: 'Beklemede',  color: colors.warning,  icon: 'time-outline',             bg: colors.warningSoft },
  Confirmed: { label: 'Onaylandı',  color: colors.success,  icon: 'checkmark-circle-outline', bg: colors.successSoft },
  Cancelled: { label: 'İptal',      color: colors.danger,   icon: 'close-circle-outline',     bg: colors.dangerSoft },
  Completed: { label: 'Tamamlandı', color: colors.info,     icon: 'checkmark-done-outline',   bg: colors.infoSoft },
};

// ─── Giriş Yapılmış Ana Sayfa ─────────────────────────────────
function AuthenticatedHome({ navigation }) {
  const { user, isEmailVerified, refreshAccountStatus } = useContext(AuthContext);
  const insets   = useSafeAreaInsets();

  const [appointments,   setAppointments]  = useState([]);
  const [messages,       setMessages]      = useState([]);
  const [requests,       setRequests]      = useState([]);
  const [loadingAppt,    setLoadingAppt]   = useState(true);
  const [loadingMsg,     setLoadingMsg]    = useState(true);
  const [loadingReqs,    setLoadingReqs]   = useState(true);
  const [notifDismissed, setNotifDismissed]= useState(false);

  const headerReveal = useScrollReveal();
  const reqReveal    = useScrollReveal();
  const apptReveal   = useScrollReveal();
  const msgReveal    = useScrollReveal();

  useEffect(() => {
    headerReveal.reveal();

    axios.get(`${API}/api/AppointmentsApi/mine`)
      .then(r => setAppointments((r.data ?? []).slice(0, 5)))
      .catch(() => setAppointments([]))
      .finally(() => { setLoadingAppt(false); apptReveal.reveal(); });

    axios.get(`${API}/api/MessagesApi/list`)
      .then(r => setMessages((r.data ?? []).slice(0, 4)))
      .catch(() => setMessages([]))
      .finally(() => { setLoadingMsg(false); msgReveal.reveal(); });

    axios.get(`${API}/api/CustomerRequestsApi/mine`)
      .then(r => setRequests((r.data ?? []).filter(r => r.isActive).slice(0, 3)))
      .catch(() => setRequests([]))
      .finally(() => { setLoadingReqs(false); reqReveal.reveal(); });
  }, []);

  const firstName    = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Hoş geldin';
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const unreadMsgs   = messages.filter(m => m.unreadCount > 0).length;
  const pendingAppts = appointments.filter(a => a.status === 'Pending').length;

  const QUICK = [
    { key: 'req',  label: 'Taleplerim',  icon: 'bulb-outline',        color: colors.warning, bg: colors.warningSoft,  count: requests.length,     unit: 'aktif',    onPress: () => navigation.navigate('CustomerRequests') },
    { key: 'appt', label: 'Randevularım',icon: 'calendar-outline',    color: colors.primary, bg: colors.primarySoft,  count: pendingAppts,        unit: 'bekliyor', onPress: () => navigation.navigate('MyAppointments') },
    { key: 'msg',  label: 'Mesajlar',    icon: 'chatbubbles-outline', color: colors.info,    bg: colors.infoSoft,     count: unreadMsgs,          unit: 'yeni',     onPress: () => navigation.navigate('Mesajlar') },
    { key: 'ord',  label: 'Siparişlerim',icon: 'receipt-outline',     color: colors.success, bg: colors.successSoft,  count: null,                unit: null,       onPress: () => navigation.navigate('Orders') },
  ];

  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await axios.post(`${API}/api/AccountApi/resend-verification`);
      Alert.alert('Email Gönderildi', 'Doğrulama emaili gelen kutunuza gönderildi.');
      await refreshAccountStatus();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Email gönderilemedi.');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: space[12] }}
    >
      {/* ── Email doğrulama banner ── */}
      {!isEmailVerified && (
        <View style={s.verifyBanner}>
          <View style={{ flex: 1 }}>
            <Text style={s.verifyBannerTitle}>⚠️ Email doğrulanmamış</Text>
            <Text style={s.verifyBannerSub}>Tüm özelliklere erişmek için emailinizi doğrulayın.</Text>
          </View>
          <TouchableOpacity
            style={[s.verifyBtn, resending && { opacity: 0.6 }]}
            onPress={handleResendEmail}
            disabled={resending}
            activeOpacity={0.8}
          >
            <Text style={s.verifyBtnTxt}>{resending ? '...' : 'Email Gönder'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Header — gradient arka plan ── */}
      <Animated.View style={headerReveal.style}>
        <LinearGradient
          colors={['rgba(70,72,212,0.10)', 'rgba(70,72,212,0.04)', 'transparent']}
          style={[s.authHeaderGrad, { paddingTop: insets.top + space[4] }]}
        >
          {/* Selamlama + bildirim */}
          <View style={s.authHeaderTop}>
            <View>
              <Text style={s.authGreeting}>{greeting},</Text>
              <Text style={s.authName}>{firstName} 👋</Text>
            </View>
            <TouchableOpacity
              style={s.notifBtn}
              onPress={() => { setNotifDismissed(true); navigation.navigate('Mesajlar'); }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {!notifDismissed && unreadMsgs > 0 && <View style={s.notifDot} />}
            </TouchableOpacity>
          </View>

          {/* 2×2 Quick Action Grid */}
          <View style={s.quickGrid}>
            {QUICK.map(qa => (
              <TouchableOpacity key={qa.key} style={s.quickCard} onPress={qa.onPress} activeOpacity={0.8}>
                <View style={[s.quickIconWrap, { backgroundColor: qa.bg }]}>
                  <Ionicons name={qa.icon} size={20} color={qa.color} />
                </View>
                <Text style={s.quickLabel}>{qa.label}</Text>
                {qa.count != null && qa.count > 0 ? (
                  <View style={[s.quickBadge, { backgroundColor: qa.bg }]}>
                    <Text style={[s.quickBadgeTxt, { color: qa.color }]}>{qa.count} {qa.unit}</Text>
                  </View>
                ) : (
                  <Text style={s.quickNone}>Yok</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Aktif Taleplerim ── */}
      <Animated.View style={[s.section, reqReveal.style]}>
        <SectionHeader
          title="Aktif Taleplerim"
          action="Tümü →"
          onAction={() => navigation.navigate('CustomerRequests')}
        />
        {loadingReqs ? (
          <View style={{ gap: space[2] }}>
            <SkeletonBox width="100%" height={58} />
            <SkeletonBox width="80%" height={58} />
          </View>
        ) : requests.length === 0 ? (
          /* Talep yoksa davetkar CTA */
          <TouchableOpacity style={s.reqCTA} onPress={() => navigation.navigate('CustomerRequests')} activeOpacity={0.8}>
            <View style={[s.reqCTAIcon, { backgroundColor: colors.warningSoft }]}>
              <Ionicons name="bulb-outline" size={22} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.reqCTATitle}>Talep oluştur</Text>
              <Text style={s.reqCTASub}>Bulunamayan hizmet için esnaflardan teklif al</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={{ gap: space[2] }}>
            {requests.map(req => (
              <TouchableOpacity
                key={req.id}
                style={s.reqRow}
                onPress={() => navigation.navigate('CustomerRequests')}
                activeOpacity={0.8}
              >
                <View style={s.reqDot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.reqRowTitle} numberOfLines={1}>{req.title}</Text>
                  <View style={s.reqRowMeta}>
                    {req.categoryHint ? <Text style={s.reqCat}>{req.categoryHint}</Text> : null}
                    <View style={s.reqOffers}>
                      <Ionicons name="briefcase-outline" size={10} color={colors.primary} />
                      <Text style={s.reqOffersTxt}>{req.offerCount ?? req.offers?.length ?? 0} teklif</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      {/* ── Randevular ── */}
      <Animated.View style={[s.section, apptReveal.style]}>
        <SectionHeader
          title="Randevularım"
          action={appointments.length > 0 ? 'Tümü →' : undefined}
          onAction={() => navigation.navigate('MyAppointments')}
        />
        {loadingAppt ? (
          <View style={{ gap: space[3] }}>
            <SkeletonBox width="100%" height={72} />
            <SkeletonBox width="100%" height={72} />
          </View>
        ) : appointments.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
            <View>
              <Text style={s.emptyCardTitle}>Randevu yok</Text>
              <Text style={s.emptyCardSub}>Hizmet bulup randevu al</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Kesfet')} activeOpacity={0.7}>
              <Text style={s.emptyCardLink}>Keşfet →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: space[3] }}>
            {appointments.map(appt => {
              const st = APPT_STATUS[appt.status] ?? APPT_STATUS.Pending;
              const date = appt.appointmentDate
                ? new Date(appt.appointmentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : '—';
              return (
                <View key={appt.id} style={s.apptCard}>
                  <View style={[s.apptIconWrap, { backgroundColor: st.bg }]}>
                    <Ionicons name={st.icon} size={20} color={st.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.apptService} numberOfLines={1}>{appt.servicePackageName || 'Hizmet'}</Text>
                    <Text style={s.apptMeta}>{appt.storeName || '—'} · {date}</Text>
                  </View>
                  <View style={[s.apptStatusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[s.apptStatusTxt, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Animated.View>

      {/* ── Son Mesajlar ── */}
      <Animated.View style={[s.section, msgReveal.style]}>
        <SectionHeader
          title="Son Mesajlar"
          action={messages.length > 0 ? 'Tümü →' : undefined}
          onAction={() => navigation.navigate('Mesajlar')}
        />
        {loadingMsg ? (
          <View style={{ gap: space[3] }}>
            <SkeletonBox width="100%" height={60} />
            <SkeletonBox width="100%" height={60} />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={28} color={colors.textMuted} />
            <View>
              <Text style={s.emptyCardTitle}>Mesaj yok</Text>
              <Text style={s.emptyCardSub}>Satıcılarla iletişime geç</Text>
            </View>
          </View>
        ) : (
          <View style={s.msgList}>
            {messages.map((msg, i) => (
              <TouchableOpacity
                key={msg.userId || i}
                style={s.msgRow}
                onPress={() => navigation.navigate('Mesajlar', { screen: 'Chat', params: { targetUserId: msg.userId, targetUserName: msg.userName } })}
                activeOpacity={0.75}
              >
                <View style={s.msgAvatar}>
                  <Text style={s.msgAvatarTxt}>{(msg.userName || '?')[0].toUpperCase()}</Text>
                  {msg.unreadCount > 0 && <View style={s.msgUnreadDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.msgName, msg.unreadCount > 0 && { color: colors.text }]} numberOfLines={1}>
                    {msg.userName || 'Kullanıcı'}
                  </Text>
                  <Text style={s.msgPreview} numberOfLines={1}>{msg.lastMessage || '...'}</Text>
                </View>
                <Text style={s.msgTime}>
                  {msg.lastMessageTime
                    ? new Date(msg.lastMessageTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { isAuthenticated } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {isAuthenticated
        ? <AuthenticatedHome navigation={navigation} />
        : <GuestLanding navigation={navigation} />}
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  // Hero
  hero: {
    paddingHorizontal: space[5],
    paddingTop: space[10],
    paddingBottom: space[8],
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: 'transparent',
    minHeight: H * 0.75,
    justifyContent: 'center',
  },
  logoArea: {
    height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: space[4],
  },
  heroTitle:  { fontFamily: fonts.display, fontSize: fontSize.xl3, color: colors.text, textAlign: 'center' },
  heroAccent: { fontFamily: fonts.display, fontSize: fontSize.xl3, color: colors.primary, textAlign: 'center' },
  heroSub: {
    fontFamily: fonts.body, fontSize: fontSize.base,
    color: colors.textSecondary, textAlign: 'center',
    marginTop: space[4], lineHeight: fontSize.base * 1.6,
  },
  ctaRow:  { flexDirection: 'row', gap: space[3], marginTop: space[6], width: '100%' },
  statsRow: { flexDirection: 'row', gap: space[3], marginTop: space[6] },
  statChip: {
    flex: 1, backgroundColor: colors.glassBg,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: space[3], alignItems: 'center', gap: 2,
  },
  statVal: { fontFamily: fonts.display, fontSize: fontSize.lg, color: colors.primary },
  statLbl: { fontFamily: fonts.body,    fontSize: fontSize.xs, color: colors.textMuted },

  // Sections
  section: {
    paddingHorizontal: space[5], paddingVertical: space[6],
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    backgroundColor: 'transparent',
  },

  // Feature cards
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  featureCard: {
    width: CARD_W, padding: space[4], gap: space[2],
    backgroundColor: colors.glassBg,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.glassBorder,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: space[1],
  },
  featureLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  featureDesc:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.5 },

  // Segmented control (Nasıl Çalışır)
  segWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 3,
    marginBottom: space[4],
    position: 'relative',
  },
  segPill: {
    position: 'absolute',
    top: 3, bottom: 3, left: 3,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadowCard,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: space[2] + 1, zIndex: 1,
  },
  segTxt:       { fontFamily: fonts.bodyMedium,   fontSize: fontSize.sm, color: colors.textMuted },
  segTxtActive: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },

  // How it works card
  howCard: {
    backgroundColor: colors.glassBg,
    borderRadius: radius.xl2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  howCardGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 80,
  },
  howCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    padding: space[5], paddingBottom: space[4],
  },
  howCardIconWrap: {
    width: 40, height: 40, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  howCardTitle: { fontFamily: fonts.displayBold,   fontSize: fontSize.md, color: colors.text },
  howCardSub:   { fontFamily: fonts.body,           fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },

  howSteps: { paddingHorizontal: space[5], paddingBottom: space[5], gap: 0 },
  howStep:  { flexDirection: 'row', gap: space[4] },
  howStepLeft:  { alignItems: 'center', width: 30 },
  howStepBubble: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  howStepNo:   { fontFamily: fonts.displayBold, fontSize: fontSize.sm },
  howStepLine: { flex: 1, width: 1, marginVertical: 4 },
  howStepBody: { flex: 1, paddingBottom: space[4], paddingTop: 4 },
  howStepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginBottom: 3 },
  howStepTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  howStepDesc:  { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: fontSize.sm * 1.5 },

  // CTA outer
  ctaOuter: { marginHorizontal: space[5], marginVertical: space[4] },

  // CTA card
  ctaCard: {
    borderRadius: radius.xl2,
    borderWidth: 1,
    borderColor: colors.glassBorderAccent,
    padding: space[6],
    gap: space[4],
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  ctaGlow: {
    position: 'absolute',
    width: 240, height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(70,72,212,0.06)',
    top: -60, right: -60,
  },
  ctaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: 4, paddingHorizontal: space[3],
    alignSelf: 'flex-start',
  },
  ctaBadgeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary,
  },
  ctaBadgeTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },
  ctaHeadline: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl2,
    color: colors.text,
    lineHeight: fontSize.xl2 * 1.2,
  },
  ctaBody: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: fontSize.base * 1.6,
  },
  ctaProof: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  ctaAvatars: { flexDirection: 'row', alignItems: 'center' },
  ctaAvatar: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  ctaProofTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textMuted },
  ctaButtons: { flexDirection: 'row', gap: space[3] },

  // ── Email doğrulama banner ──────────────────────────────
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: 'rgba(251,191,36,0.10)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(251,191,36,0.3)',
    paddingHorizontal: space[4], paddingVertical: space[3],
  },
  verifyBannerTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  verifyBannerSub:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  verifyBtn: {
    backgroundColor: 'rgba(251,191,36,0.2)', borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.5)',
    paddingVertical: space[2], paddingHorizontal: space[3],
  },
  verifyBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: '#92400E' },

  // ── Authenticated Header ──────────────────────────────────
  authHeaderGrad: {
    paddingHorizontal: space[5],
    paddingBottom: space[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: space[4],
  },
  authHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  authGreeting: { fontFamily: fonts.body,    fontSize: fontSize.base, color: colors.textMuted },
  authName:     { fontFamily: fonts.display, fontSize: fontSize.xl2,  color: colors.text },
  notifBtn: {
    width: 42, height: 42, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1, borderColor: colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5, borderColor: colors.surface,
  },

  // Quick action 2×2 grid
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: space[3],
  },
  quickCard: {
    width: (W - space[5] * 2 - space[3]) / 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl2,
    borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4], gap: space[2],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  quickIconWrap: {
    width: 42, height: 42, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  quickBadge: {
    borderRadius: radius.pill,
    paddingVertical: 3, paddingHorizontal: space[2],
    alignSelf: 'flex-start',
  },
  quickBadgeTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },
  quickNone:     { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },

  // Taleplerim satırları
  reqCTA: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.xl2, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  reqCTAIcon: {
    width: 44, height: 44, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  reqCTATitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  reqCTASub:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: fontSize.xs * 1.5 },
  reqRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[3] + 2,
  },
  reqDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.success,
  },
  reqRowTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  reqRowMeta:  { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: 2 },
  reqCat: {
    fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textMuted,
  },
  reqOffers: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reqOffersTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },

  // ── Randevu Kartı ─────────────────────────────────────────
  apptCard: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4],
  },
  apptIconWrap: {
    width: 40, height: 40, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  apptService: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  apptMeta:    { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  apptStatusBadge: {
    paddingVertical: 3, paddingHorizontal: space[2],
    borderRadius: radius.pill,
  },
  apptStatusTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },

  // ── Mesaj Listesi ─────────────────────────────────────────
  msgList: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  msgRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    padding: space[4],
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  msgAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  msgAvatarTxt: { fontFamily: fonts.displayBold, fontSize: fontSize.base, color: colors.primary },
  msgUnreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5, borderColor: colors.surface,
  },
  msgName:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm,   color: colors.textSecondary },
  msgPreview: { fontFamily: fonts.body,          fontSize: fontSize.xs,   color: colors.textMuted, marginTop: 1 },
  msgTime:    { fontFamily: fonts.body,          fontSize: fontSize.xs,   color: colors.textMuted },

  // ── Boş durum kartı ──────────────────────────────────────
  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: space[4],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4],
  },
  emptyCardTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  emptyCardSub:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  emptyCardLink:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },
});
