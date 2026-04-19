import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert, ScrollView, Image, TextInput } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const ProductsScreen = ({ navigation, route }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(route?.params?.categoryId || null);
  const [searchQuery, setSearchQuery] = useState('');
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
      setAllProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      console.warn('Veri çekilemedi', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = allProducts;
    
    if (selectedCategory) {
      filtered = filtered.filter(p => (p.categoryId || p.CategoryId) === selectedCategory);
    }
    
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || p.Name || '').toLowerCase().includes(lowerQuery) ||
        (p.store?.name || p.store?.Name || '').toLowerCase().includes(lowerQuery) ||
        (p.category?.name || p.category?.Name || '').toLowerCase().includes(lowerQuery)
      );
    }
    
    setProducts(filtered);
  }, [allProducts, selectedCategory, searchQuery]);

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Üye Girişi Gerekli',
        'Sepete ürün ekleyebilmek için giriş yapmalısınız.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    try {
      const { data } = await axios.post('/api/CartApi', { productId, quantity: 1 });
      Alert.alert('Başarılı ✅', data.message || 'Ürün sepete eklendi');
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || 'Sepete eklenemedi');
    }
  };

  const renderProduct = ({ item, index }) => (
    <TouchableOpacity 
      style={[styles.card, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <View style={styles.imagePlaceholder}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <Text style={styles.placeholderEmoji}>📦</Text>
        )}
      </View>
      <View style={styles.cardInfo}>
        {item.store && (
          <Text style={styles.storeName}>🛍 {item.store.name || item.store.Name}</Text>
        )}
        {item.category && !item.store && (
          <Text style={styles.categoryLabel}>{item.category.name || item.category.Name}</Text>
        )}
        <Text style={styles.productName} numberOfLines={2}>{item.name || item.Name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₺{(item.price || item.Price || 0).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item.id || item.Id)}>
          <Text style={styles.addBtnText}>Sepete Ekle</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>Ürünler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Ürün, kategori veya mağaza ara..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Kategori Filtre Çubuğu */}
      {categories.length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
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

      {/* Sonuç sayısı */}
      <View style={styles.resultBar}>
        <Text style={styles.resultText}>{products.length} ürün listeleniyor</Text>
      </View>

      {/* Ürün Grid (2 sütun) */}
      <FlatList
        data={products}
        keyExtractor={(item) => (item.id || item.Id).toString()}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
            <Text style={styles.emptyTitle}>
              {selectedCategory ? 'Bu kategoride ürün bulunamadı.' : 'Henüz ürün bulunmuyor.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ProductsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  clearBtn: { padding: 4 },
  clearBtnText: { color: colors.textMuted, fontSize: 16, fontWeight: 'bold' },
  filterBar: {
    backgroundColor: 'transparent',
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  resultBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContainer: { paddingHorizontal: 12, paddingBottom: 20 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderEmoji: { fontSize: 36 },
  cardInfo: { padding: 12 },
  storeName: {
    fontSize: 10,
    color: colors.accentDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  emptyContainer: { marginTop: 60, alignItems: 'center' },
  emptyTitle: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
});
