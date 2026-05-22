import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Image, Dimensions,
  Animated, Pressable, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import Badge from '../components/Badge';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';
import { API_BASE } from '../config';

const API = API_BASE;
const { width: W } = Dimensions.get('window');
const GRID_PAD = space[4];
const GRID_GAP = space[3];

const FILTERS = [
  { label: 'Tümü',   value: '',         icon: 'apps-outline' },
  { label: 'Hizmet', value: 'Service',  icon: 'hammer-outline' },
  { label: 'Online', value: 'Online',   icon: 'laptop-outline' },
  { label: 'Mağaza', value: 'Physical', icon: 'storefront-outline' },
];

const SORT_OPTIONS = [
  { label: 'Varsayılan',             value: 'default',    icon: 'swap-vertical-outline' },
  { label: 'En Yüksek Puan',        value: 'rating',     icon: 'star-outline' },
  { label: 'Fiyat: Düşük → Yüksek', value: 'price_asc',  icon: 'trending-up-outline' },
  { label: 'Fiyat: Yüksek → Düşük', value: 'price_desc', icon: 'trending-down-outline' },
];

const TYPE_CONFIG = {
  Service:  { label: 'Hizmet',  variant: 'success', icon: 'hammer-outline',     gradient: ['#14532D', '#15803D', '#22C55E'] },
  Online:   { label: 'Online',  variant: 'primary', icon: 'laptop-outline',     gradient: ['#1e1c9e', '#4648D4', '#818CF8'] },
  Physical: { label: 'Mağaza',  variant: 'info',    icon: 'storefront-outline', gradient: ['#075985', '#0369A1', '#38BDF8'] },
};
const DEFAULT_TYPE = { label: 'Sağlayıcı', variant: 'neutral', icon: 'person-outline', gradient: ['#1e1c9e', '#4648D4', '#818CF8'] };

// ─── Cover fallback ───────────────────────────────────────────
function CoverFallback({ name, storeType }) {
  const cfg = TYPE_CONFIG[storeType] ?? DEFAULT_TYPE;
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
  return (
    <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 52, color: 'rgba(255,255,255,0.18)', letterSpacing: -2 }}>
          {initials}
        </Text>
      </View>
      <Ionicons name={cfg.icon} size={22} color="rgba(255,255,255,0.22)"
        style={{ position: 'absolute', bottom: 10, right: 14 }} />
    </LinearGradient>
  );
}

// ─── List card ────────────────────────────────────────────────
function ListCard({ item, onPress }) {
  const cfg   = TYPE_CONFIG[item.storeType] ?? DEFAULT_TYPE;
  const cover = item.bannerImageUrl || item.profileImageUrl;
  return (
    <TouchableOpacity style={s.listCard} onPress={onPress} activeOpacity={0.88}>
      <View style={s.listCover}>
        {cover
          ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <CoverFallback name={item.name} storeType={item.storeType} />}
        <View style={s.listCoverRow}>
          <Badge label={cfg.label} variant={cfg.variant} dot size="sm" />
          {item.averageRating > 0 && (
            <View style={s.ratingPill}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={s.ratingTxt}>{item.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={s.listBody}>
        <Text style={s.listName} numberOfLines={1}>{item.name}</Text>
        <View style={s.listMeta}>
          {item.providerCity ? (
            <View style={s.metaRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={s.metaTxt}>{item.providerCity}</Text>
            </View>
          ) : null}
          {item.minPrice != null ? (
            <View style={s.metaRow}>
              <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
              <Text style={s.metaPrice}>₺{item.minPrice}</Text>
              <Text style={s.metaTxt}>'den başlayan</Text>
            </View>
          ) : null}
        </View>
        {item.description ? <Text style={s.listDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={s.listActions}>
          <View style={s.actionPrimary}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={s.actionPrimaryTxt}>Randevu Al</Text>
          </View>
          <View style={s.actionSecondary}>
            <Ionicons name="chatbubble-outline" size={13} color={colors.textSecondary} />
            <Text style={s.actionSecondaryTxt}>Mesaj</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Grid card ────────────────────────────────────────────────
function GridCard({ item, onPress }) {
  const cfg   = TYPE_CONFIG[item.storeType] ?? DEFAULT_TYPE;
  const cover = item.bannerImageUrl || item.profileImageUrl;
  return (
    <TouchableOpacity style={s.gridCard} onPress={onPress} activeOpacity={0.88}>
      <View style={s.gridCover}>
        {cover
          ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <CoverFallback name={item.name} storeType={item.storeType} />}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={[StyleSheet.absoluteFill, s.gridOverlay]}>
          <Text style={s.gridName} numberOfLines={2}>{item.name}</Text>
          {item.city ? <Text style={s.gridCity} numberOfLines={1}>{item.city}</Text> : null}
        </LinearGradient>
        <View style={s.gridTopRow}>
          <Badge label={cfg.label} variant={cfg.variant} size="sm" />
          {item.averageRating > 0 && (
            <View style={s.gridRating}>
              <Ionicons name="star" size={9} color="#F59E0B" />
              <Text style={s.gridRatingTxt}>{item.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
      {item.minPrice != null ? (
        <View style={s.gridPrice}>
          <Text style={s.gridPriceVal}>₺{item.minPrice}</Text>
          <Text style={s.gridPriceSub}>'den</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Sort sheet ───────────────────────────────────────────────
function SortSheet({ visible, current, onSelect, onClose }) {
  const sheetY    = useRef(new Animated.Value(320)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 320, duration: 220, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.42)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Sırala</Text>
        {SORT_OPTIONS.map(opt => {
          const active = current === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[s.sheetRow, active && s.sheetRowActive]}
              onPress={() => { onSelect(opt.value); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={[s.sheetIconWrap, active && { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={opt.icon} size={18} color={active ? colors.primary : colors.textMuted} />
              </View>
              <Text style={[s.sheetRowTxt, active && s.sheetRowTxtActive]}>{opt.label}</Text>
              {active && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 24 }} />
      </Animated.View>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────
function SkeletonListCard() {
  return (
    <View style={[s.listCard, { overflow: 'hidden' }]}>
      <SkeletonBox width="100%" height={180} borderRadius={0} />
      <View style={{ padding: space[4], gap: space[2] }}>
        <SkeletonBox width="55%" height={15} />
        <SkeletonBox width="38%" height={12} />
        <SkeletonBox width="88%" height={12} />
      </View>
    </View>
  );
}
function SkeletonGridCard() {
  return (
    <View style={[s.gridCard, { overflow: 'hidden', flex: 1 }]}>
      <SkeletonBox width="100%" height={160} borderRadius={0} />
      <View style={{ padding: space[2] }}>
        <SkeletonBox width="65%" height={11} />
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function ServicesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [providers,   setProviders]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('');
  const [sort,        setSort]        = useState('default');
  const [viewMode,    setViewMode]    = useState('list');
  const [sortVisible, setSortVisible] = useState(false);

  // storeType ve backend-destekli sort → backend query param
  // search → client-side (anlık tepki için)
  // price sort → client-side
  const fetchProviders = useCallback(async (storeType, sortVal) => {
    const params = new URLSearchParams();
    if (storeType) params.append('storeType', storeType);
    if (sortVal === 'rating')  params.append('sort', 'rating');
    if (sortVal === 'newest')  params.append('sort', 'newest');
    try {
      const res = await axios.get(`${API}/api/StoresApi/discover?${params.toString()}`);
      setProviders(res.data ?? []);
    } catch { setProviders([]); }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProviders(filter, sort).finally(() => setLoading(false));
  }, [filter, sort]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProviders(filter, sort);
    setRefreshing(false);
  };

  // Client-side: sadece arama + price sort (backend desteklemiyor)
  const filtered = providers.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.providerCity?.toLowerCase().includes(q);
  });

  const sorted = (sort === 'price_asc')
    ? [...filtered].sort((a, b) => (a.minPrice ?? 999999) - (b.minPrice ?? 999999))
    : (sort === 'price_desc')
    ? [...filtered].sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0))
    : filtered;

  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Varsayılan';
  const hasFilter = filter !== '' || search !== '';
  const isGrid    = viewMode === 'grid';

  const ResultsBar = (
    <View style={s.resultsBar}>
      <Text style={s.resultsTxt}>
        <Text style={s.resultsBold}>{sorted.length}</Text>{'  sağlayıcı  ·  '}{sortLabel}
      </Text>
      {hasFilter && (
        <TouchableOpacity onPress={() => { setSearch(''); setFilter(''); setSort('default'); }} activeOpacity={0.7}>
          <Text style={s.clearTxt}>Temizle</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={s.root}>
      {/* ── Sticky header ── */}
      <View style={s.header}>
        {/* Arama */}
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} style={{ marginLeft: space[3] }} />
          <TextInput
            style={s.searchInput}
            placeholder="Hizmet, esnaf veya şehir ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: space[3] }}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {/* Filter + sort + view toggle */}
        <View style={s.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterList}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[s.filterChip, filter === f.value && s.filterChipActive]}
                onPress={() => setFilter(f.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={f.icon} size={13} color={filter === f.value ? colors.primary : colors.textMuted} />
                <Text style={[s.filterTxt, filter === f.value && s.filterTxtActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.filterDivider} />
          <TouchableOpacity
            style={[s.sortBtn, sort !== 'default' && s.sortBtnActive]}
            onPress={() => setSortVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="funnel-outline" size={13} color={sort !== 'default' ? colors.primary : colors.textSecondary} />
            <Text style={[s.sortTxt, sort !== 'default' && { color: colors.primary }]}>Sırala</Text>
          </TouchableOpacity>
          <View style={s.filterDivider} />
          <View style={s.viewToggle}>
            <TouchableOpacity style={[s.toggleBtn, !isGrid && s.toggleBtnActive]} onPress={() => setViewMode('list')} activeOpacity={0.7}>
              <Ionicons name="list-outline" size={17} color={!isGrid ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, isGrid && s.toggleBtnActive]} onPress={() => setViewMode('grid')} activeOpacity={0.7}>
              <Ionicons name="grid-outline" size={17} color={isGrid ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── İçerik ── */}
      {loading ? (
        <ScrollView contentContainerStyle={{ padding: space[4], gap: space[3] }} showsVerticalScrollIndicator={false}>
          {isGrid ? (
            <View style={{ flexDirection: 'row', gap: GRID_GAP }}>
              <SkeletonGridCard /><SkeletonGridCard />
            </View>
          ) : [1, 2, 3].map(i => <SkeletonListCard key={i} />)}
        </ScrollView>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Sonuç bulunamadı"
          description="Farklı bir arama deneyin ya da filtreyi kaldırın."
          action="Filtreyi Temizle"
          onAction={() => { setSearch(''); setFilter(''); }}
        />
      ) : (
        <FlatList
          key={viewMode}
          data={sorted}
          keyExtractor={i => String(i.id)}
          numColumns={isGrid ? 2 : 1}
          ListHeaderComponent={ResultsBar}
          contentContainerStyle={isGrid ? s.gridContent : s.listContent}
          columnWrapperStyle={isGrid ? s.gridRow : undefined}
          ItemSeparatorComponent={() => <View style={{ height: isGrid ? GRID_GAP : space[3] }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) =>
            isGrid
              ? <GridCard item={item} onPress={() => navigation.navigate('ProviderProfile', { store: item })} />
              : <ListCard item={item} onPress={() => navigation.navigate('ProviderProfile', { store: item })} />
          }
        />
      )}

      {/* ── Sort Sheet ── */}
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    paddingBottom: space[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: space[5], marginTop: space[3], marginBottom: space[3],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
  },
  searchInput: {
    flex: 1, paddingVertical: space[3], paddingHorizontal: space[3],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
  },
  filterRow:     { flexDirection: 'row', alignItems: 'center' },
  filterList:    { paddingLeft: space[5], paddingRight: space[2], gap: space[2] },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: space[3],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  filterTxt:        { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  filterTxtActive:  { fontFamily: fonts.bodySemiBold, color: colors.primary },
  filterDivider:    { width: 1, height: 22, backgroundColor: colors.borderSubtle, marginHorizontal: space[2] },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 7, paddingHorizontal: space[3],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  sortTxt:       { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  viewToggle:    { flexDirection: 'row', gap: 4, marginRight: space[4] },
  toggleBtn: {
    width: 30, height: 30, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  toggleBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.glassBorder },

  resultsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space[5], paddingVertical: space[3],
  },
  resultsTxt:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  resultsBold: { fontFamily: fonts.bodySemiBold, color: colors.text },
  clearTxt:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },

  listContent: { paddingHorizontal: space[5], paddingBottom: space[12] },
  listCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl2,
    borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  listCover:    { height: 185, position: 'relative' },
  listCoverRow: {
    position: 'absolute', top: space[3], left: space[3], right: space[3],
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: space[2],
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  ratingTxt:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.text },
  listBody:   { padding: space[4], gap: space[2] },
  listName:   { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text },
  listMeta:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space[4] },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:    { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  metaPrice:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },
  listDesc:   { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: fontSize.sm * 1.55 },
  listActions: { flexDirection: 'row', gap: space[2], marginTop: space[1] },
  actionPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: 6, paddingHorizontal: space[3],
  },
  actionPrimaryTxt:   { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },
  actionSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: 6, paddingHorizontal: space[3],
  },
  actionSecondaryTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },

  gridContent: { paddingBottom: space[12] },
  gridRow:     { paddingHorizontal: GRID_PAD, gap: GRID_GAP },
  gridCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  gridCover:   { height: 160, position: 'relative' },
  gridOverlay: { justifyContent: 'flex-end', padding: space[2] },
  gridTopRow: {
    position: 'absolute', top: space[2], left: space[2], right: space[2],
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  gridName:    { fontFamily: fonts.displayBold, fontSize: fontSize.xs, color: '#fff', lineHeight: fontSize.xs * 1.4 },
  gridCity:    { fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  gridRating: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: 5,
  },
  gridRatingTxt: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: '#fff' },
  gridPrice:    { flexDirection: 'row', alignItems: 'baseline', gap: 2, padding: space[2] },
  gridPriceVal: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },
  gridPriceSub: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3],
    borderWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
  },
  sheetHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  sheetTitle:       { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text, marginBottom: space[4] },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    paddingVertical: space[3], borderRadius: radius.xl, paddingHorizontal: space[2],
  },
  sheetRowActive:   { backgroundColor: colors.primarySoft },
  sheetIconWrap: {
    width: 36, height: 36, borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetRowTxt:      { fontFamily: fonts.bodyMedium, fontSize: fontSize.base, color: colors.text },
  sheetRowTxtActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
});
