import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import axios from 'axios';
import { colors } from '../theme/colors';

const STORE_TYPES = [
  { value: '',         label: 'Tümü' },
  { value: 'Service',  label: 'Esnaf' },
  { value: 'Online',   label: 'Online' },
  { value: 'Physical', label: 'Mağaza' },
];

const DiscoverScreen = ({ navigation }) => {
  const [providers, setProviders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeType, setStoreType]   = useState('');
  const [search, setSearch]         = useState('');

  const fetchProviders = useCallback(async () => {
    try {
      const res = await axios.get('/api/StoresApi/discover', {
        params: { storeType: storeType || undefined, search: search || undefined, sort: 'rating' }
      });
      setProviders(res.data);
    } catch (e) {
      console.error('Discover hatası:', e.message);
      setProviders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeType, search]);

  useEffect(() => { fetchProviders(); }, [storeType]);

  const onRefresh = () => { setRefreshing(true); fetchProviders(); };
  const onSearch  = () => { setLoading(true); fetchProviders(); };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProviderProfile', { storeId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.cover}>
        {item.bannerImageUrl
          ? <Image source={{ uri: item.bannerImageUrl }} style={styles.coverImg} />
          : <View style={styles.coverPlaceholder}>
              <Text style={styles.coverInitial}>{item.name?.[0]?.toUpperCase()}</Text>
            </View>
        }
        {item.storeType && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {item.storeType === 'Service' ? 'Esnaf' :
               item.storeType === 'Online'  ? 'Online' :
               item.storeType === 'Physical' ? 'Mağaza' : item.storeType}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.providerLine} numberOfLines={1}>
          {item.providerName}{item.providerCity ? ` · ${item.providerCity}` : ''}
        </Text>
        <View style={styles.footer}>
          {item.averageRating != null && (
            <Text style={styles.rating}>★ {item.averageRating.toFixed(1)} <Text style={styles.reviewCount}>({item.reviewCount})</Text></Text>
          )}
          {item.minPrice != null && (
            <Text style={styles.price}>{item.minPrice.toLocaleString('tr-TR')}₺<Text style={styles.priceFrom}>'den</Text></Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hero / Search */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Yakınındaki ustayı bul</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Hizmet, usta ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={onSearch} style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>Ara</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.chips}>
        {STORE_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            onPress={() => setStoreType(t.value)}
            style={[styles.chip, storeType === t.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, storeType === t.value && styles.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : providers.length === 0 ? (
        <View style={styles.center}><Text style={styles.empty}>Sonuç yok. Filtreleri değiştir.</Text></View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  hero: { padding: 20, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: {
    flex: 1, backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 14
  },
  searchBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  searchBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },

  chips: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.accent },

  card: { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderSubtle },
  cover: { aspectRatio: 16 / 10, backgroundColor: colors.surfaceRaised, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  coverInitial: { fontSize: 48, fontWeight: '700', color: colors.accent },
  typeBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(13,13,20,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },

  body: { padding: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  providerLine: { fontSize: 13, color: colors.textTertiary || colors.textMuted, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  rating: { color: colors.warning, fontWeight: '700', fontSize: 13 },
  reviewCount: { color: colors.textMuted, fontWeight: '400' },
  price: { color: colors.text, fontWeight: '700', fontSize: 14 },
  priceFrom: { color: colors.textMuted, fontWeight: '400', fontSize: 11 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  empty: { color: colors.textMuted, fontSize: 14 },
});

export default DiscoverScreen;
