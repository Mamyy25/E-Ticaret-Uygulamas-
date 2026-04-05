import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const OrdersScreen = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/OrderApi');
      setOrders(data);
    } catch {
      console.warn('Siparişler çekilemedi');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 48 }}>🔒</Text>
        <Text style={styles.emptyTitle}>Giriş yapmalısınız</Text>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const statusBg = {
    Pending: '#f59e0b',
    Processing: '#3b82f6',
    Shipped: '#8b5cf6',
    Delivered: '#22c55e',
    Cancelled: '#ef4444',
  };

  const renderOrder = ({ item: order }) => (
    <TouchableOpacity style={styles.card} onPress={() => setExpandedId(expandedId === order.id ? null : order.id)} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Sipariş #{order.id}</Text>
          <Text style={styles.orderDate}>{new Date(order.orderDate).toLocaleDateString('tr-TR')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg[order.status] || '#94a3b8' }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
          <Text style={styles.orderTotal}>₺{order.totalAmount?.toLocaleString()}</Text>
        </View>
      </View>

      {expandedId === order.id && order.items && (
        <View style={styles.details}>
          {order.shippingAddress && <Text style={styles.address}>📍 {order.shippingAddress}{order.shippingCity ? `, ${order.shippingCity}` : ''}</Text>}
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemInfo}>{item.quantity}x ₺{item.price?.toLocaleString()}</Text>
              <Text style={styles.itemSub}>₺{item.subTotal?.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
            <Text style={styles.emptyTitle}>Henüz siparişiniz yok</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 17, fontWeight: '700', color: colors.text },
  orderDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginBottom: 6 },
  statusText: { color: 'white', fontSize: 12, fontWeight: '600' },
  orderTotal: { fontSize: 18, fontWeight: '800', color: colors.primary },
  details: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  address: { fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemName: { flex: 1, fontSize: 14, color: colors.text },
  itemInfo: { fontSize: 13, color: colors.textMuted, marginRight: 12 },
  itemSub: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
