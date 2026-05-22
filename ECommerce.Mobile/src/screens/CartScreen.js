import React, { useState, useContext, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Pressable,
  StyleSheet, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import Button from '../components/Button';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';
import Divider from '../components/Divider';

import { API_BASE } from '../config';
const API = API_BASE;

// ─── Adet kontrol butonu ─────────────────────────────────────
function QtyBtn({ icon, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => !disabled && Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start()}
      onPress={!disabled ? onPress : undefined}
    >
      <Animated.View style={[s.qtyBtn, disabled && s.qtyBtnDisabled, { transform: [{ scale }] }]}>
        <Ionicons name={icon} size={16} color={disabled ? colors.textDisabled : colors.primary} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Sepet ürün kartı ────────────────────────────────────────
function CartItem({ item, onUpdate, onRemove }) {
  const [updating, setUpdating] = useState(false);

  const update = async (qty) => {
    setUpdating(true);
    await onUpdate(item.cartItemId, qty);
    setUpdating(false);
  };

  return (
    <View style={s.itemCard}>
      <View style={s.itemLeft}>
        <View style={s.itemIconBox}>
          <Ionicons name="cube-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.itemName} numberOfLines={2}>{item.productName}</Text>
          <Text style={s.itemUnitPrice}>₺{item.unitPrice?.toLocaleString()} / adet</Text>
        </View>
      </View>
      <View style={s.itemRight}>
        {/* Adet kontrolü */}
        <View style={s.qtyRow}>
          <QtyBtn icon="remove" onPress={() => update(Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1 || updating} />
          <Text style={s.qtyVal}>{item.quantity}</Text>
          <QtyBtn icon="add" onPress={() => update(item.quantity + 1)} disabled={updating} />
        </View>
        <View style={s.itemBottomRow}>
          <Text style={s.itemSubtotal}>₺{item.subTotal?.toLocaleString()}</Text>
          <TouchableOpacity onPress={() => onRemove(item.cartItemId)} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const { isAuthenticated } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [cart, setCart]       = useState({ items: [], totalItems: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) fetchCart();
      else setLoading(false);
    }, [isAuthenticated])
  );

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/CartApi`);
      setCart(data ?? { items: [], totalItems: 0, totalAmount: 0 });
    } catch {
      setCart({ items: [], totalItems: 0, totalAmount: 0 });
    }
    setLoading(false);
  };

  const handleUpdate = async (cartItemId, quantity) => {
    try {
      await axios.put(`${API}/api/CartApi/${cartItemId}`, { quantity });
      await fetchCart();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Miktar güncellenemedi');
    }
  };

  const handleRemove = (cartItemId) => {
    Alert.alert('Ürünü Kaldır', 'Bu ürün sepetten silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API}/api/CartApi/${cartItemId}`);
            await fetchCart();
          } catch {
            Alert.alert('Hata', 'Ürün silinemedi');
          }
        },
      },
    ]);
  };

  // ── Auth gerekli ──
  if (!isAuthenticated) {
    return (
      <View style={s.root}>
        <EmptyState
          icon="lock-closed-outline"
          title="Giriş yapmalısın"
          description="Sepetini görmek için giriş yap."
          action="Giriş Yap"
          onAction={() => navigation.navigate('GirisYap')}
        />
      </View>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={s.root}>
        <View style={{ padding: space[5], gap: space[3] }}>
          {[1, 2, 3].map(i => <SkeletonBox key={i} width="100%" height={90} />)}
        </View>
      </View>
    );
  }

  const items = cart.items ?? [];

  return (
    <View style={s.root}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.cartItemId)}
        contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={items.length > 0 ? (
          <LinearGradient
            colors={['rgba(70,72,212,0.07)', 'transparent']}
            style={{ borderRadius: radius.xl, padding: space[4], marginBottom: space[1] }}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textSecondary }}>
              {items.length} ürün · Toplam{' '}
              <Text style={{ fontFamily: fonts.displayBold, color: colors.primary }}>₺{cart.totalPrice?.toLocaleString('tr-TR')}</Text>
            </Text>
          </LinearGradient>
        ) : null}
        ListEmptyComponent={
          <EmptyState
            icon="bag-outline"
            title="Sepetiniz boş"
            description="Beğendiğin ürün veya hizmetleri sepete ekle."
            action="Keşfet"
            onAction={() => navigation.navigate('Kesfet')}
          />
        }
        renderItem={({ item }) => (
          <CartItem item={item} onUpdate={handleUpdate} onRemove={handleRemove} />
        )}
      />

      {/* ── Sticky özet ── */}
      {items.length > 0 && (
        <View style={[s.summary, { paddingBottom: insets.bottom + space[3] }]}>
          <View style={s.summaryTop}>
            <View>
              <Text style={s.summaryLabel}>Toplam ({cart.totalItems} ürün)</Text>
              <Text style={s.summaryTotal}>₺{cart.totalAmount?.toLocaleString()}</Text>
            </View>
            <Button
              label="Sipariş Ver →"
              onPress={() => navigation.navigate('Checkout', { totalAmount: cart.totalAmount })}
              variant="primary"
              size="lg"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space[4],
    gap: space[3],
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  itemIconBox: {
    width: 44, height: 44,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName:      { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  itemUnitPrice: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },

  itemRight: { gap: space[2] },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    width: 32, height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSubtle,
  },
  qtyVal: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text, minWidth: 24, textAlign: 'center' },

  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemSubtotal: { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.primary },

  // Summary
  summary: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: space[5],
    paddingTop: space[4],
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  summaryTotal: { fontFamily: fonts.display, fontSize: fontSize.xl2, color: colors.primary, marginTop: 2 },
});
