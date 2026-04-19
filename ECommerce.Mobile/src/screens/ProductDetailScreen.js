import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import axios from 'axios';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { isAuthenticated } = useContext(AuthContext);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Üye Girişi Gerekli',
        'Sepete eklemek için lütfen giriş yapın.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    try {
      await axios.post('/api/CartApi', { productId: product.id || product.Id, quantity: 1 });
      Alert.alert('Başarılı ✅', 'Ürün sepete eklendi!');
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || 'Sepete eklenemedi');
    }
  };

  const price = product.price || product.Price || 0;
  const stock = product.stock || product.Stock || 0;
  const name = product.name || product.Name;
  const description = product.description || product.Description || 'Açıklama bulunmuyor.';
  const categoryName = product.category?.name || product.category?.Name || 'Kategori Belirtilmedi';
  const storeName = product.store?.name || product.store?.Name;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Ürün Görseli */}
        <View style={styles.imageBox}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 64 }}>📦</Text>
              <Text style={styles.placeholderText}>Görsel Yok</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Kategori Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{categoryName}</Text>
            </View>
            {stock > 0 ? (
              <View style={[styles.badge, styles.stockBadge]}>
                <Text style={styles.stockText}>✓ Stokta ({stock})</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.outOfStock]}>
                <Text style={styles.outOfStockText}>Tükendi</Text>
              </View>
            )}
          </View>

          {/* Ürün Adı */}
          <Text style={styles.productName}>{name}</Text>

          {/* Fiyat */}
          <Text style={styles.price}>₺{price.toLocaleString()}</Text>

          {/* Satıcı Bilgisi */}
          {storeName && (
            <View style={styles.storeBox}>
              <View>
                <Text style={styles.storeLabel}>Satıcı</Text>
                <Text style={styles.storeName}>🛍 {storeName}</Text>
              </View>
            </View>
          )}

          {/* Açıklama */}
          <View style={styles.descBox}>
            <Text style={styles.descTitle}>Ürün Açıklaması</Text>
            <Text style={styles.descText}>{description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Alt Sabit Buton */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Toplam</Text>
          <Text style={styles.bottomPrice}>₺{price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.cartBtn, stock <= 0 && styles.cartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={stock <= 0}
          activeOpacity={0.8}
        >
          <Text style={styles.cartBtnText}>{stock > 0 ? '🛒  Sepete Ekle' : 'Tükendi'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  imageBox: {
    width: '100%',
    height: 300,
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: colors.textMuted,
    fontWeight: '600',
  },

  content: {
    padding: 20,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  outOfStock: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },

  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 20,
  },

  storeBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  descBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 5,
  },
  bottomLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  cartBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cartBtnDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
  },
  cartBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
});
