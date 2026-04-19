import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const CartScreen = ({ navigation }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmount: 0 });
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
      const { data } = await axios.get('/api/CartApi');
      setCart(data);
    } catch {
      setCart({ items: [], totalItems: 0, totalAmount: 0 });
    }
    setLoading(false);
  };

  const updateQty = async (cartItemId, quantity) => {
    try {
      await axios.put(`/api/CartApi/${cartItemId}`, { quantity });
      fetchCart();
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || 'Miktar güncellenemedi');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await axios.delete(`/api/CartApi/${cartItemId}`);
      fetchCart();
    } catch {
      Alert.alert('Hata', 'Ürün silinemedi');
    }
  };

  const placeOrder = () => {
    navigation.navigate('Checkout', { totalAmount: cart.totalAmount });
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 48 }}>🔒</Text>
        <Text style={styles.emptyTitle}>Sepetiniz için giriş yapın</Text>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.unitPrice}>₺{item.unitPrice?.toLocaleString()} / adet</Text>
      </View>
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.cartItemId, Math.max(1, item.quantity - 1))}>
          <Text style={styles.qtyText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.cartItemId, item.quantity + 1)}>
          <Text style={styles.qtyText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subTotal}>₺{item.subTotal?.toLocaleString()}</Text>
      <TouchableOpacity onPress={() => removeItem(item.cartItemId)} style={styles.removeBtn}>
        <Text style={styles.removeTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cart.items || []}
        keyExtractor={(item) => item.cartItemId?.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🛒</Text>
            <Text style={styles.emptyTitle}>Sepetiniz Boş</Text>
          </View>
        }
        ListFooterComponent={cart.items?.length > 0 ? (
          <View style={styles.footer}>
            <View>
              <Text style={{ color: colors.textMuted }}>Toplam ({cart.totalItems} ürün)</Text>
              <Text style={styles.totalPrice}>₺{cart.totalAmount?.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.orderBtn} onPress={placeOrder}>
              <Text style={styles.orderBtnText}>Sipariş Ver</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  productName: { fontSize: 16, fontWeight: '600', color: colors.text },
  unitPrice: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 18, fontWeight: '600', color: colors.text },
  qtyValue: { fontSize: 16, fontWeight: '700', marginHorizontal: 10, color: colors.text },
  subTotal: { fontSize: 16, fontWeight: '700', color: colors.primary, width: 80, textAlign: 'right' },
  removeBtn: { marginLeft: 12, padding: 4 },
  removeTxt: { fontSize: 16, color: colors.danger, fontWeight: 'bold' },
  footer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  totalPrice: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: 4 },
  orderBtn: { backgroundColor: colors.secondary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  orderBtnText: { color: colors.surface, fontWeight: 'bold', fontSize: 16 },
});
