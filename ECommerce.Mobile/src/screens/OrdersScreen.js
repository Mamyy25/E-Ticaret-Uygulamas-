import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import Badge from '../components/Badge';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';
import Divider from '../components/Divider';

import { API_BASE } from '../config';
const API = API_BASE;

const STATUS = {
  Pending:    { label: 'Beklemede',   variant: 'warning',  icon: 'time-outline' },
  Processing: { label: 'Hazırlanıyor', variant: 'info',    icon: 'refresh-outline' },
  Shipped:    { label: 'Kargoda',     variant: 'primary',  icon: 'bicycle-outline' },
  Delivered:  { label: 'Teslim Edildi', variant: 'success', icon: 'checkmark-circle-outline' },
  Cancelled:  { label: 'İptal',       variant: 'danger',   icon: 'close-circle-outline' },
};

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(heightAnim, { toValue, friction: 8, useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const st = STATUS[order.status] ?? { label: order.status, variant: 'neutral', icon: 'ellipse-outline' };
  const date = new Date(order.orderDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const maxH   = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] });

  return (
    <View style={s.card}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={s.cardHeader}>
        <View style={[s.statusDot, { backgroundColor: colors[st.variant === 'neutral' ? 'textMuted' : st.variant] ?? colors.textMuted }]} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.orderId}>Sipariş #{order.id}</Text>
          <Text style={s.orderDate}>{date}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: space[2] }}>
          <Badge label={st.label} variant={st.variant} />
          <Text style={s.orderTotal}>₺{order.totalAmount?.toLocaleString()}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }], marginLeft: space[2] }}>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Expandable ürün listesi */}
      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        <Divider />
        <View style={s.itemsWrap}>
          {(order.items ?? order.orderItems ?? []).map((item, i) => (
            <View key={i} style={s.orderItem}>
              <View style={s.orderItemIcon}>
                <Ionicons name="cube-outline" size={16} color={colors.primary} />
              </View>
              <Text style={s.orderItemName} numberOfLines={1}>{item.productName}</Text>
              <Text style={s.orderItemQty}>×{item.quantity}</Text>
              <Text style={s.orderItemPrice}>₺{item.subTotal?.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { isAuthenticated } = React.useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setLoading(true);
        axios.get(`${API}/api/OrderApi`)
          .then(r => setOrders(r.data ?? []))
          .catch(() => setOrders([]))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }, [isAuthenticated])
  );

  if (!isAuthenticated) {
    return (
      <View style={s.root}>
        <EmptyState
          icon="lock-closed-outline"
          title="Giriş yapmalısın"
          description="Siparişlerini görmek için giriş yap."
          action="Giriş Yap"
          onAction={() => navigation.navigate('GirisYap')}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[s.root, { padding: space[5], gap: space[3] }]}>
        {[1, 2, 3].map(i => <SkeletonBox key={i} width="100%" height={80} />)}
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <FlatList
        data={orders}
        keyExtractor={o => String(o.id)}
        contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Henüz sipariş yok"
            description="Verdiğin siparişler burada görünecek."
            action="Alışverişe Başla"
            onAction={() => navigation.navigate('Kesfet')}
          />
        }
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    gap: space[3],
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  orderId:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  orderDate:  { fontFamily: fonts.body,         fontSize: fontSize.xs,   color: colors.textMuted },
  orderTotal: { fontFamily: fonts.displayBold,  fontSize: fontSize.base, color: colors.primary },

  itemsWrap: { padding: space[4], gap: space[3] },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  orderItemIcon: {
    width: 30, height: 30, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  orderItemName:  { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.text, flex: 1 },
  orderItemQty:   { fontFamily: fonts.body,        fontSize: fontSize.xs, color: colors.textMuted },
  orderItemPrice: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },
});
