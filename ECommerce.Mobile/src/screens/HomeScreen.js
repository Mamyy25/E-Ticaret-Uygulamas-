import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const HomeScreen = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get('/api/ProductsApi').catch(() => axios.get('/api/Products')),
        axios.get('/api/CategoriesApi').catch(() => axios.get('/api/Categories')),
      ]);
      setAllProducts(prodRes.data);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.warn('Veri çekilemedi', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (categoryId) => {
    if (categoryId === selectedCategory) {
      setSelectedCategory(null);
      setProducts(allProducts);
      return;
    }
    setSelectedCategory(categoryId);
    try {
      const { data } = await axios.get(`/api/ProductsApi/category/${categoryId}`).catch(() =>
        axios.get(`/api/Products/category/${categoryId}`)
      );
      setProducts(data);
    } catch {
      setProducts(allProducts.filter(p => (p.categoryId || p.CategoryId) === categoryId));
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Yapın', 'Sepete eklemek için önce oturum açmalısınız.');
      return;
    }
    try {
      const { data } = await axios.post('/api/CartApi', { productId, quantity: 1 });
      Alert.alert('Başarılı ✅', data.message || 'Ürün sepete eklendi');
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || 'Sepete eklenemedi');
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.placeholderText}>Görsel</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.productName} numberOfLines={1}>{item.name || item.Name}</Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category.name || item.category.Name}</Text>
            </View>
          )}
        </View>
        <Text style={styles.productDesc} numberOfLines={2}>
          {item.description || item.Description || "Açıklama bulunmuyor..."}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₺{(item.price || item.Price || 0).toLocaleString()}</Text>
          <TouchableOpacity style={styles.buyBtn} onPress={() => handleAddToCart(item.id || item.Id)}>
            <Text style={styles.btnText}>Sepete Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textMuted }}>Katalog Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Kategori Filtreleme Çubuğu */}
      {categories.length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            <TouchableOpacity
              style={[styles.filterBtn, selectedCategory === null && styles.filterBtnActive]}
              onPress={() => { setSelectedCategory(null); setProducts(allProducts); }}
            >
              <Text style={[styles.filterText, selectedCategory === null && styles.filterTextActive]}>Tümü</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id || cat.Id}
                style={[styles.filterBtn, selectedCategory === (cat.id || cat.Id) && styles.filterBtnActive]}
                onPress={() => handleCategoryFilter(cat.id || cat.Id)}
              >
                <Text style={[styles.filterText, selectedCategory === (cat.id || cat.Id) && styles.filterTextActive]}>
                  {cat.name || cat.Name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={(item) => (item.id || item.Id).toString()}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📭</Text>
            <Text style={styles.emptyText}>
              {selectedCategory ? 'Bu kategoride ürün bulunmuyor.' : 'Şimdilik satılacak ürün yok.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  filterBar: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  filterTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%', height: 180, backgroundColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderText: { color: colors.textMuted, fontWeight: '500' },
  cardInfo: { padding: 16 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
  categoryBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginLeft: 8 },
  categoryText: { fontSize: 11, color: colors.primary, fontWeight: '500' },
  productDesc: { fontSize: 14, color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  buyBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: colors.surface, fontWeight: '600', fontSize: 14 },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});
