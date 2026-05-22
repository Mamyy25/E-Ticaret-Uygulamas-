import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, Dimensions, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import { API_BASE } from '../config';

const API = API_BASE;
const { width: W } = Dimensions.get('window');
const GATEWAY_W = (W - space[5] * 2 - space[3]) / 2;

// ─── Kategoriler (görsel) ─────────────────────────────────────
const CATEGORIES = [
  { label: 'Tasarım',     icon: 'color-palette-outline', color: '#7C3AED' },
  { label: 'Yazılım',     icon: 'code-slash-outline',    color: '#0369A1' },
  { label: 'Fotoğraf',    icon: 'camera-outline',        color: '#0F766E' },
  { label: 'Eğitim',      icon: 'school-outline',        color: '#B45309' },
  { label: 'Danışmanlık', icon: 'briefcase-outline',     color: '#1D4ED8' },
  { label: 'Pazarlama',   icon: 'megaphone-outline',     color: '#BE185D' },
  { label: 'Hukuk',       icon: 'document-text-outline', color: '#374151' },
];

// ─── Kompakt provider kartı (yatay kaydırma) ─────────────────
function CompactCard({ item, onPress }) {
  const CARD_W = 155;
  const gradient = item.storeType === 'Service'
    ? ['#14532D', '#15803D', '#22C55E']
    : item.storeType === 'Online'
    ? ['#1e1c9e', '#4648D4', '#818CF8']
    : ['#075985', '#0369A1', '#38BDF8'];

  const cover    = item.bannerImageUrl || item.profileImageUrl;
  const initials = (item.name ?? '?')
    .split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';

  return (
    <TouchableOpacity
      style={[s.compCard, { width: CARD_W }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Cover */}
      <View style={s.compCover}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={s.compInitials}>{initials}</Text>
            </View>
          </LinearGradient>
        )}
        {/* Bottom overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: space[2] }]}
        >
          <Text style={s.compName} numberOfLines={2}>{item.name}</Text>
        </LinearGradient>
        {/* Rating */}
        {item.averageRating > 0 && (
          <View style={s.compRating}>
            <Ionicons name="star" size={9} color="#F59E0B" />
            <Text style={s.compRatingTxt}>{item.averageRating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      {/* Price */}
      {item.minPrice != null && (
        <View style={s.compPrice}>
          <Text style={s.compPriceVal}>₺{item.minPrice}</Text>
          <Text style={s.compPriceSub}>'den</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Gateway kart ─────────────────────────────────────────────
function GatewayCard({ gradient, icon, decor, title, subtitle, badge, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start()}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale }], width: GATEWAY_W }}>
        {/* Gradient border wrapper */}
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)']}
          style={s.gatewayBorderWrap}
        >
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.gatewayInner}>

            {/* Dekoratif arka plan daireleri */}
            <View style={[s.decorCircle, { width: 90, height: 90, top: -28, right: -28, opacity: 0.12 }]} />
            <View style={[s.decorCircle, { width: 55, height: 55, bottom: -12, left: -12, opacity: 0.09 }]} />

            {/* Dekoratif ikonlar */}
            {decor.map((d, i) => (
              <Ionicons
                key={i} name={d.icon} size={d.size}
                color={`rgba(255,255,255,${d.opacity})`}
                style={{ position: 'absolute', top: d.top, right: d.right, left: d.left, bottom: d.bottom }}
              />
            ))}

            {/* İçerik */}
            <View style={s.gatewayContent}>
              {/* Ana ikon */}
              <View style={s.gatewayIconWrap}>
                <Ionicons name={icon} size={22} color="#fff" />
              </View>

              <Text style={s.gatewayTitle}>{title}</Text>
              <Text style={s.gatewaySub}>{subtitle}</Text>

              {/* Alt badge */}
              <View style={s.gatewayBadge}>
                <Text style={s.gatewayBadgeTxt}>{badge}</Text>
                <Ionicons name="arrow-forward" size={11} color="rgba(255,255,255,0.85)" />
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Section header ───────────────────────────────────────────
function SectionTitle({ title, action, onAction }) {
  return (
    <View style={s.sectionTitle}>
      <Text style={s.sectionTitleTxt}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={s.sectionLink}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function DiscoverScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [providers,     setProviders]     = useState([]);
  const [productCount,  setProductCount]  = useState(0);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/StoresApi/discover`).catch(() => ({ data: [] })),
      axios.get(`${API}/api/ProductsApi`).catch(() => ({ data: [] })),
    ]).then(([storesRes, productsRes]) => {
      setProviders(storesRes.data ?? []);
      setProductCount((productsRes.data ?? []).length);
    }).finally(() => setLoading(false));
  }, []);

  const popular = providers.slice(0, 8);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Özel başlık (nav header gizli) ────────────────── */}
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>Keşfet</Text>
        <TouchableOpacity
          style={s.topBarSearch}
          onPress={() => navigation.navigate('Services')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <Text style={s.topBarSearchTxt}>Hizmet, esnaf veya ürün ara...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Gateway kartlar ───────────────────────────── */}
        <View style={s.gatewayRow}>
          <GatewayCard
            gradient={['#1a1890', '#4648D4', '#7B7FF5']}
            icon="hammer-outline"
            decor={[
              { icon: 'calendar-outline',  size: 44, opacity: 0.18, top: 8,   right: 8 },
              { icon: 'person-outline',    size: 28, opacity: 0.13, bottom: 28, right: 14 },
              { icon: 'briefcase-outline', size: 20, opacity: 0.10, top: 40,  right: 48 },
            ]}
            title="Hizmetler"
            subtitle={'Yerel esnaf &\nonline uzman'}
            badge={loading ? '...' : `${providers.length} sağlayıcı`}
            onPress={() => navigation.navigate('Services')}
          />
          <GatewayCard
            gradient={['#0c4a6e', '#0369A1', '#0EA5E9']}
            icon="cube-outline"
            decor={[
              { icon: 'download-outline',  size: 44, opacity: 0.18, top: 8,   right: 8 },
              { icon: 'diamond-outline',   size: 26, opacity: 0.13, bottom: 28, right: 14 },
              { icon: 'sparkles-outline',  size: 18, opacity: 0.10, top: 42,  right: 50 },
            ]}
            title="Ürünler"
            subtitle={'Dijital içerik &\nşablonlar'}
            badge={loading ? '...' : `${productCount} ürün`}
            onPress={() => navigation.navigate('Products')}
          />
        </View>

        {/* ── Kategoriler ───────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle title="Kategoriler" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catList}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.label}
                style={s.catChip}
                onPress={() => navigation.navigate('Services')}
                activeOpacity={0.75}
              >
                <View style={[s.catIconWrap, { backgroundColor: cat.color + '18' }]}>
                  <Ionicons name={cat.icon} size={17} color={cat.color} />
                </View>
                <Text style={s.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Önerilen Mağazalar ────────────────────────── */}
        <View style={s.section}>
          <SectionTitle
            title="Önerilen Mağazalar"
            action="Tümünü gör →"
            onAction={() => navigation.navigate('Services')}
          />
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.compList}>
              {[1, 2, 3].map(i => (
                <View key={i} style={{ width: 155, borderRadius: radius.xl, overflow: 'hidden', gap: space[1] }}>
                  <SkeletonBox width={155} height={110} />
                  <SkeletonBox width={100} height={11} />
                </View>
              ))}
            </ScrollView>
          ) : providers.length === 0 ? (
            <View style={s.emptyRow}>
              <Ionicons name="storefront-outline" size={28} color={colors.textMuted} />
              <Text style={s.emptyTxt}>Henüz mağaza yok</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.compList}>
              {popular.map(item => (
                <CompactCard
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate('ProviderProfile', { store: item })}
                />
              ))}
              {/* "Tümünü gör" kart */}
              <TouchableOpacity
                style={s.seeAllCard}
                onPress={() => navigation.navigate('Services')}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-forward-circle-outline" size={28} color={colors.primary} />
                <Text style={s.seeAllTxt}>Tümünü{'\n'}Gör</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* ── Talep Oluştur CTA ─────────────────────────── */}
        <View style={s.ctaOuter}>
          <LinearGradient
            colors={['#312E81', '#4648D4', '#6063EE']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.ctaCard}
          >
            {/* Dekoratif daireler */}
            <View style={[s.ctaCircle, { width: 120, height: 120, top: -40, right: -30, opacity: 0.12 }]} />
            <View style={[s.ctaCircle, { width: 70,  height: 70,  top: 20,  right: 50,  opacity: 0.08 }]} />
            <View style={[s.ctaCircle, { width: 50,  height: 50,  bottom: -15, left: -15, opacity: 0.10 }]} />

            {/* İkon */}
            <View style={s.ctaIconWrap}>
              <Ionicons name="bulb-outline" size={24} color="#fff" />
            </View>

            {/* Metin */}
            <Text style={s.ctaTitle}>Aradığını bulamadın mı?</Text>
            <Text style={s.ctaBody}>
              İhtiyacın olan hizmet veya ürünü listede göremiyorsan talep oluştur, sana uygun sağlayıcı ulaşsın.
            </Text>

            {/* Butonlar */}
            <View style={s.ctaButtons}>
              <TouchableOpacity
                style={s.ctaBtnPrimary}
                onPress={() => navigation.navigate('CustomerRequests')}
                activeOpacity={0.85}
              >
                <Text style={s.ctaBtnPrimaryTxt}>Talep Oluştur</Text>
                <Ionicons name="arrow-forward" size={15} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.ctaBtnSecondary}
                onPress={() => navigation.navigate('Services')}
                activeOpacity={0.85}
              >
                <Text style={s.ctaBtnSecondaryTxt}>Keşfet</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: space[10] }} />
      </ScrollView>
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.canvas },
  scroll: { paddingBottom: space[6] },

  // Özel top bar
  topBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    paddingHorizontal: space[5],
    paddingTop: space[3], paddingBottom: space[3],
    gap: space[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
  },
  topBarTitle: { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text },
  topBarSearch: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[3], paddingHorizontal: space[3],
  },
  topBarSearchTxt: {
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textMuted,
  },

  // Gateway
  gatewayRow: {
    flexDirection: 'row', gap: space[3],
    paddingHorizontal: space[5],
    paddingTop: space[5], paddingBottom: space[2],
  },
  gatewayBorderWrap: {
    borderRadius: radius.xl2 + 1,
    padding: 1.5,
  },
  gatewayInner: {
    borderRadius: radius.xl2,
    height: 178,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  gatewayContent: {
    flex: 1,
    padding: space[4],
    justifyContent: 'flex-end',
  },
  gatewayIconWrap: {
    width: 38, height: 38, borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space[3],
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  gatewayTitle: {
    fontFamily: fonts.display, fontSize: fontSize.md,
    color: '#fff', lineHeight: fontSize.md * 1.2,
  },
  gatewaySub: {
    fontFamily: fonts.body, fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: fontSize.xs * 1.55, marginTop: 3,
  },
  gatewayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: space[3],
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 4, paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  gatewayBadgeTxt: {
    fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: 'rgba(255,255,255,0.9)',
  },

  // Section
  section: { paddingHorizontal: space[5], paddingTop: space[5] },
  sectionTitle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: space[3],
  },
  sectionTitleTxt: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text },
  sectionLink:    { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.primary },

  // Kategoriler
  catList: { gap: space[3], paddingBottom: space[1] },
  catChip: { alignItems: 'center', gap: space[2] },
  catIconWrap: {
    width: 52, height: 52, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  catLabel: {
    fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary,
    textAlign: 'center',
  },

  // Kompakt kart
  compList: { gap: space[3], paddingBottom: space[1] },
  compCard: {
    borderRadius: radius.xl, overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  compCover:      { height: 112, position: 'relative' },
  compInitials: {
    fontFamily: fonts.display, fontSize: 34,
    color: 'rgba(255,255,255,0.2)', letterSpacing: -1,
  },
  compName: { fontFamily: fonts.displayBold, fontSize: fontSize.xs, color: '#fff', lineHeight: fontSize.xs * 1.4 },
  compRating: {
    position: 'absolute', top: space[2], right: space[2],
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: 5,
  },
  compRatingTxt: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: '#fff' },
  compPrice:     { flexDirection: 'row', alignItems: 'baseline', gap: 2, padding: space[2] },
  compPriceVal:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },
  compPriceSub:  { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted },

  // "Tümünü gör" kart
  seeAllCard: {
    width: 80, borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
    gap: space[2], paddingVertical: space[3],
  },
  seeAllTxt: {
    fontFamily: fonts.bodyMedium, fontSize: fontSize.xs,
    color: colors.primary, textAlign: 'center', lineHeight: fontSize.xs * 1.5,
  },

  // Talep CTA
  ctaOuter: { paddingHorizontal: space[5], paddingTop: space[5] },
  ctaCard: {
    borderRadius: radius.xl2,
    padding: space[5],
    gap: space[3],
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ctaCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  ctaIconWrap: {
    width: 48, height: 48, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: {
    fontFamily: fonts.display, fontSize: fontSize.lg,
    color: '#fff', lineHeight: fontSize.lg * 1.2,
  },
  ctaBody: {
    fontFamily: fonts.body, fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: fontSize.sm * 1.6,
  },
  ctaButtons: { flexDirection: 'row', gap: space[3], marginTop: space[1] },
  ctaBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingVertical: space[3], paddingHorizontal: space[4],
  },
  ctaBtnPrimaryTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },
  ctaBtnSecondary: {
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: space[3], paddingHorizontal: space[4],
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ctaBtnSecondaryTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.88)' },

  // Boş durum
  emptyRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, padding: space[4],
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  emptyTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted },

});
