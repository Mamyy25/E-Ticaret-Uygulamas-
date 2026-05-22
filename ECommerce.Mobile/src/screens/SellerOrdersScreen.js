import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import Divider from '../components/Divider';
import { API_BASE } from '../config';

const STATUS = {
  Pending:    { label: 'Beklemede',    variant: 'warning' },
  Processing: { label: 'Hazırlanıyor', variant: 'info'    },
  Shipped:    { label: 'Kargoda',      variant: 'primary' },
  Delivered:  { label: 'Teslim Edildi',variant: 'success' },
  Cancelled:  { label: 'İptal',        variant: 'danger'  },
};

function OrderRow({ item }) {
  const st   = STATUS[item.status] ?? { label: item.status, variant: 'neutral' };
  const date = item.orderDate
    ? new Date(item.orderDate).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.iconBox}>
          <Ionicons name="cube-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.productName} numberOfLines={2}>{item.productName}</Text>
          <Text style={s.buyerName}>{item.buyerName ?? '—'}</Text>
        </View>
        <Badge label={st.label} variant={st.variant} />
      </View>

      <Divider style={{ marginVertical: space[3] }} />

      <View style={s.metaGrid}>
        <View style={s.metaItem}>
          <Ionicons name="layers-outline" size={13} color={colors.textMuted} />
          <Text style={s.metaTxt}>×{item.quantity} adet</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="cash-outline" size={13} color={colors.textMuted} />
          <Text style={s.metaTxt}>₺{item.subTotal?.toLocaleString('tr-TR')}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={s.metaTxt}>{date}</Text>
        </View>
        {item.shippingCity ? (
          <View style={s.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={s.metaTxt}>{item.shippingCity}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      axios.get(`${API_BASE}/api/OrderApi/seller-orders`)
        .then(r => setOrders(r.data ?? []))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <View style={[s.root, { padding: space[5], gap: space[3] }]}>
        {[1, 2, 3].map(i => <SkeletonBox key={i} width="100%" height={120} />)}
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <FlatList
        data={orders}
        keyExtractor={o => String(o.orderItemId)}
        contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={orders.length > 0 ? (
          <Text style={s.count}>{orders.length} gelen sipariş</Text>
        ) : null}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Henüz sipariş yok"
            description="Mağazanıza gelen siparişler burada görünecek."
          />
        }
        renderItem={({ item }) => <OrderRow item={item} />}
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
    marginBottom: space[2],
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space[4],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  productName: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  buyerName:   { fontFamily: fonts.body,         fontSize: fontSize.xs,   color: colors.textMuted },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  metaTxt: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary },
});
