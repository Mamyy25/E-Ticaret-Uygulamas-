import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Image, Dimensions, Animated, Alert, ScrollView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';

const SORT_OPTIONS = [
  { label: 'En Yeni',          value: 'newest',     icon: 'time-outline' },
  { label: 'En Yüksek Puan',   value: 'popular',    icon: 'star-outline' },
  { label: 'Fiyat: Düşük →',   value: 'price_asc',  icon: 'trending-up-outline' },
  { label: 'Fiyat: Yüksek ↓',  value: 'price_desc', icon: 'trending-down-outline' },
];

// Sort sheet
function SortSheet({ visible, current, onSelect, onClose }) {
  const sheetY    = useRef(new Animated.Value(280)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 280, duration: 220, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.42)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[ps.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={ps.handle} />
        <Text style={ps.sheetTitle}>Sırala</Text>
        {SORT_OPTIONS.map(opt => {
          const active = current === opt.value;
          return (
            <TouchableOpacity key={opt.value} style={[ps.row, active && ps.rowActive]} onPress={() => { onSelect(opt.value); onClose(); }} activeOpacity={0.7}>
              <View style={[ps.rowIcon, active && { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={opt.icon} size={18} color={active ? colors.primary : colors.textMuted} />
              </View>
              <Text style={[ps.rowTxt, active && ps.rowTxtActive]}>{opt.label}</Text>
              {active && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </Animated.View>
    </View>
  );
}

const { width: W } = Dimensions.get('window');
const GRID_PAD = space[4];
const GRID_GAP = space[3];
const CARD_W   = (W - GRID_PAD * 2 - GRID_GAP) / 2;

// Dosya tipine göre gradient + ikon
const FILE_TYPE_CONFIG = {
  pdf:      { gradient: ['#7C2D12', '#C2410C', '#F97316'], icon: 'document-text-outline',  label: 'PDF' },
  zip:      { gradient: ['#1e1c9e', '#4648D4', '#818CF8'], icon: 'archive-outline',         label: 'ZIP' },
  png:      { gradient: ['#0F766E', '#0D9488', '#2DD4BF'], icon: 'image-outline',           label: 'PNG' },
  jpg:      { gradient: ['#0F766E', '#0D9488', '#2DD4BF'], icon: 'image-outline',           label: 'JPG' },
  mp4:      { gradient: ['#581C87', '#7E22CE', '#A855F7'], icon: 'videocam-outline',         label: 'MP4' },
  mp3:      { gradient: ['#1D4ED8', '#2563EB', '#60A5FA'], icon: 'musical-notes-outline',   label: 'MP3' },
  default:  { gradient: ['#1e1c9e', '#4648D4', '#6063EE'], icon: 'cube-outline',            label: 'Dijital' },
};

function getFileConfig(fileType) {
  if (!fileType) return FILE_TYPE_CONFIG.default;
  return FILE_TYPE_CONFIG[fileType.toLowerCase()] ?? FILE_TYPE_CONFIG.default;
}

// Ürün cover (gradient fallback veya gerçek görsel)
function ProductCover({ imageUrl, fileType, name }) {
  const cfg      = getFileConfig(fileType);
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
  return (
    <View style={s.cover}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={s.coverInitials}>{initials}</Text>
          </View>
          <Ionicons name={cfg.icon} size={18} color="rgba(255,255,255,0.25)"
            style={{ position: 'absolute', bottom: 8, right: 10 }} />
        </LinearGradient>
      )}
      {/* Dijital ürün rozeti */}
      {fileType && (
        <View style={s.fileTypeBadge}>
          <Ionicons name={cfg.icon} size={9} color="#fff" />
          <Text style={s.fileTypeTxt}>{cfg.label}</Text>
        </View>
      )}
    </View>
  );
}

// Ürün kartı
function ProductCard({ item, onPress, onAddCart }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], width: CARD_W }}>
      <TouchableOpacity
        style={s.card}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start()}
        activeOpacity={1}
      >
        <ProductCover imageUrl={item.imageUrl} fileType={item.fileType} name={item.name} />

        <View style={s.cardBody}>
          {item.store?.name && (
            <Text style={s.cardStore} numberOfLines={1}>{item.store.name}</Text>
          )}
          <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
          <View style={s.cardBottom}>
            <Text style={s.cardPrice}>₺{(item.price ?? 0).toLocaleString('tr-TR')}</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => onAddCart(item.id)} activeOpacity={0.8}>
              <Ionicons name="bag-add-outline" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Skeleton
function SkeletonCard() {
  return (
    <View style={[s.card, { width: CARD_W, overflow: 'hidden' }]}>
      <SkeletonBox width="100%" height={130} borderRadius={0} />
      <View style={{ padding: space[3], gap: space[1] }}>
        <SkeletonBox width="55%" height={11} />
        <SkeletonBox width="80%" height={13} />
        <SkeletonBox width="40%" height={16} />
      </View>
    </View>
  );
}

export default function ProductsScreen({ navigation, route }) {
  const [allProducts,      setAllProducts]      = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(route?.params?.categoryId ?? null);
  const [search,           setSearch]           = useState('');
  const [sort,             setSort]             = useState('newest');
  const [sortVisible,      setSortVisible]      = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);

  const fetchData = useCallback(async (catId, sortVal) => {
    try {
      const params = new URLSearchParams();
      params.append('sort', sortVal ?? 'newest');
      if (catId) params.append('categoryId', catId);
      const [prodRes, catRes] = await Promise.all([
        axios.get(`/api/ProductsApi?${params.toString()}`).catch(() => ({ data: [] })),
        axios.get('/api/CategoriesApi').catch(() => ({ data: [] })),
      ]);
      setAllProducts(prodRes.data ?? []);
      setCategories(catRes.data ?? []);
    } catch { }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData(selectedCategory, sort).finally(() => setLoading(false));
  }, [selectedCategory, sort]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(selectedCategory, sort);
    setRefreshing(false);
  };

  // Sadece search client-side (anlık tepki)
  const filtered = allProducts.filter(p => {
    const q = search.toLowerCase();
    return !q || (p.name ?? '').toLowerCase().includes(q) || (p.store?.name ?? '').toLowerCase().includes(q);
  });

  const handleAddCart = async (productId) => {
    try {
      const { data } = await axios.post('/api/CartApi', { productId, quantity: 1 });
      Alert.alert('Sepete Eklendi', data.message || 'Ürün sepetinize eklendi.');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.includes('giriş') || err.response?.status === 401) {
        Alert.alert('Giriş Gerekli', 'Sepete eklemek için giriş yapın.');
      } else {
        Alert.alert('Hata', msg || 'Sepete eklenemedi.');
      }
    }
  };

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        {/* Arama */}
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} style={{ marginLeft: space[3] }} />
          <TextInput
            style={s.searchInput}
            placeholder="Ürün veya mağaza ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: space[3] }}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Kategori chips + Sort butonu */}
        <View style={s.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catList}>
            <TouchableOpacity
              style={[s.catChip, selectedCategory === null && s.catChipActive]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={[s.catChipTxt, selectedCategory === null && s.catChipTxtActive]}>Tümü</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id ?? cat.Id}
                style={[s.catChip, selectedCategory === (cat.id ?? cat.Id) && s.catChipActive]}
                onPress={() => setSelectedCategory(cat.id ?? cat.Id)}
                activeOpacity={0.7}
              >
                <Text style={[s.catChipTxt, selectedCategory === (cat.id ?? cat.Id) && s.catChipTxtActive]}>
                  {cat.name ?? cat.Name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.filterDivider} />
          <TouchableOpacity
            style={[s.sortBtn, sort !== 'newest' && s.sortBtnActive]}
            onPress={() => setSortVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="funnel-outline" size={13} color={sort !== 'newest' ? colors.primary : colors.textSecondary} />
            <Text style={[s.sortTxt, sort !== 'newest' && { color: colors.primary }]}>Sırala</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Grid ── */}
      {loading ? (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id ?? item.Id)}
          numColumns={2}
          ListHeaderComponent={
            <View style={s.resultsBar}>
              <Text style={s.resultsTxt}>
                <Text style={s.resultsBold}>{filtered.length}</Text>
                {'  ürün  ·  '}{SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'En Yeni'}
              </Text>
              {(search || selectedCategory) && (
                <TouchableOpacity onPress={() => { setSearch(''); setSelectedCategory(null); }} activeOpacity={0.7}>
                  <Text style={s.clearTxt}>Temizle</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={s.gridContent}
          columnWrapperStyle={s.gridRow}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="Ürün bulunamadı"
              description="Farklı bir arama deneyin ya da filtreyi kaldırın."
              action="Filtreyi Temizle"
              onAction={() => { setSearch(''); setSelectedCategory(null); }}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
              onAddCart={handleAddCart}
            />
          )}
        />
      )}

      {/* Sort Sheet */}
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.canvas },

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
  catList:       { paddingLeft: space[5], paddingRight: space[2], gap: space[2], paddingBottom: space[1] },
  filterDivider: { width: 1, height: 22, backgroundColor: colors.borderSubtle, marginHorizontal: space[2] },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 7, paddingHorizontal: space[3], marginRight: space[4],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  sortTxt:       { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  clearTxt:      { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },
  catChip: {
    paddingVertical: 7, paddingHorizontal: space[3],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  catChipTxt:    { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  catChipTxtActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },

  resultsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GRID_PAD, paddingVertical: space[3] },
  resultsTxt:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  resultsBold: { fontFamily: fonts.bodySemiBold, color: colors.text },

  gridContent:    { paddingBottom: space[12] },
  gridRow:        { paddingHorizontal: GRID_PAD, gap: GRID_GAP },
  skeletonGrid:   { flexDirection: 'row', flexWrap: 'wrap', padding: GRID_PAD, gap: GRID_GAP, paddingTop: space[4] },

  // Kart
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl2, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cover:         { height: 130, position: 'relative' },
  coverInitials: { fontFamily: fonts.display, fontSize: 40, color: 'rgba(255,255,255,0.2)', letterSpacing: -1 },
  fileTypeBadge: {
    position: 'absolute', top: space[2], left: space[2],
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 7,
  },
  fileTypeTxt:   { fontFamily: fonts.bodySemiBold, fontSize: 10, color: '#fff' },

  cardBody:   { padding: space[3], gap: space[1] },
  cardStore: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },
  cardName:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.4 },
  cardBottom:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space[1] },
  cardPrice: { fontFamily: fonts.display, fontSize: fontSize.md, color: colors.text },
  addBtn: {
    width: 32, height: 32, borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
});

const ps = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3],
    borderWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
  },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  sheetTitle:{ fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text, marginBottom: space[4] },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    paddingVertical: space[3], borderRadius: radius.xl, paddingHorizontal: space[2],
  },
  rowActive:  { backgroundColor: colors.primarySoft },
  rowIcon: {
    width: 36, height: 36, borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center',
  },
  rowTxt:     { fontFamily: fonts.bodyMedium, fontSize: fontSize.base, color: colors.text },
  rowTxtActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
});
