import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';

const TYPE_CONFIG = {
  store:   { icon: 'storefront-outline', label: 'Mağaza',  variant: 'success',  color: colors.success },
  product: { icon: 'cube-outline',       label: 'Ürün',    variant: 'primary',  color: colors.primary },
  service: { icon: 'briefcase-outline',  label: 'Hizmet',  variant: 'info',     color: colors.info },
};

// Favori ekleme/kaldırma yardımcıları — başka ekranlarda da kullanılabilir
export const FAVORITES_KEY = '@kairos_favorites';

export async function getFavorites() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function toggleFavorite(item) {
  // item: { id, type, name, sub }
  const favs = await getFavorites();
  const idx  = favs.findIndex(f => f.id === item.id && f.type === item.type);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.unshift({ ...item, savedAt: new Date().toISOString() });
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return idx < 0; // true = eklendi, false = kaldırıldı
}

export async function isFavorited(id, type) {
  const favs = await getFavorites();
  return favs.some(f => f.id === id && f.type === type);
}

// ─── Ekran ───────────────────────────────────────────────────
function FavCard({ item, onRemove, onPress }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.store;
  const date = item.savedAt
    ? new Date(item.savedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : '';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.cardIcon, { backgroundColor: cfg.color + '15' }]}>
        <Ionicons name={cfg.icon} size={24} color={cfg.color} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <Badge label={cfg.label} variant={cfg.variant} size="sm" />
          {item.sub && <Text style={s.cardSub} numberOfLines={1}>{item.sub}</Text>}
        </View>
        {date ? <Text style={s.cardDate}>{date} tarihinde eklendi</Text> : null}
      </View>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={10}
        style={s.removeBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={22} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FavoritesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(f => {
        setFavorites(f);
        setLoading(false);
      });
    }, [])
  );

  const handleRemove = async (item) => {
    await toggleFavorite(item);
    setFavorites(prev => prev.filter(f => !(f.id === item.id && f.type === item.type)));
  };

  const handlePress = (item) => {
    if (item.type === 'store') {
      navigation.navigate('Kesfet');
    } else if (item.type === 'product' || item.type === 'service') {
      navigation.navigate('AnaSayfa');
    }
  };

  if (loading) return <View style={[s.root, { paddingTop: insets.top }]} />;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <FlatList
        data={favorites}
        keyExtractor={i => `${i.type}-${i.id}`}
        contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          favorites.length > 0 ? (
            <Text style={s.count}>{favorites.length} favori</Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Henüz favori yok"
            description="Mağaza veya ürün sayfasındaki ❤️ butonuna basarak favorilerine ekleyebilirsin."
            action="Keşfetmeye Başla"
            onAction={() => navigation.navigate('Kesfet')}
          />
        }
        renderItem={({ item }) => (
          <FavCard
            item={item}
            onRemove={() => handleRemove(item)}
            onPress={() => handlePress(item)}
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  count: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: space[3],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space[4],
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  cardSub:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  cardDate: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textDisabled, marginTop: 1 },
  removeBtn: { padding: space[1] },
});
