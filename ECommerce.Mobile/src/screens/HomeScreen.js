import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const catRes = await axios.get('/api/CategoriesApi').catch(() => axios.get('/api/Categories'));
      setCategories(catRes.data || []);

      try {
        const featRes = await axios.get('/api/ProductsApi/featured');
        setFeaturedProducts((featRes.data || []).slice(0, 6));
      } catch {
        // Featured endpoint yoksa ilk 6 ürünü al
        const prodRes = await axios.get('/api/ProductsApi').catch(() => axios.get('/api/Products'));
        setFeaturedProducts((prodRes.data || []).slice(0, 6));
      }
    } catch (error) {
      console.warn('Veri çekilemedi', error);
    } finally {
      setLoading(false);
    }
  };

  // Kategori ikonları
  const categoryIcons = {
    'elektronik': '💻',
    'giyim': '👕',
    'kitap': '📚',
    'oyun': '🎮',
    'spor': '⚽',
    'ev': '🏠',
    'yiyecek': '🍔',
    'kozmetik': '💄',
  };

  const getCategoryIcon = (name) => {
    const key = (name || '').toLowerCase();
    return categoryIcons[key] || '📦';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ─── HERO SECTION ─── */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTagline}>YENİ SEZON</Text>
            <Text style={styles.heroTitle}>
              {isAuthenticated ? `Hoş Geldin, ${user?.name || user?.sub || 'Kullanıcı'} 👋` : 'Keşfetmeye Başla 👋'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Farklı satıcılardan binlerce ürün ve hizmet seni bekliyor.
            </Text>
            <TouchableOpacity 
              style={styles.heroBtn} 
              onPress={() => navigation.navigate('Products')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroBtnText}>🛍  TÜM ÜRÜNLERİ KEŞFET</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── KATEGORİLER ─── */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kategoriler</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAll}>Tümünü Gör →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.id || cat.Id} 
                  style={styles.categoryCard}
                  onPress={() => navigation.navigate('Products', { categoryId: cat.id || cat.Id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryIconBox}>
                    <Text style={styles.categoryEmoji}>{getCategoryIcon(cat.name || cat.Name)}</Text>
                  </View>
                  <Text style={styles.categoryName}>{cat.name || cat.Name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── ÖNE ÇIKANLAR ─── */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ Öne Çıkanlar</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAll}>Hepsini Gör →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
              {featuredProducts.map((product) => (
                <TouchableOpacity 
                  key={product.id || product.Id} 
                  style={styles.featuredCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ProductDetail', { product })}
                >
                  <View style={styles.featuredImg}>
                    {product.imageUrl ? (
                      <Image source={{ uri: product.imageUrl }} style={styles.featuredImage} />
                    ) : (
                      <Text style={{ fontSize: 32 }}>📦</Text>
                    )}
                  </View>
                  <View style={styles.featuredInfo}>
                    {product.store && (
                      <Text style={styles.featuredStore}>🛍 {product.store.name || product.store.Name}</Text>
                    )}
                    <Text style={styles.featuredName} numberOfLines={2}>{product.name || product.Name}</Text>
                    <Text style={styles.featuredPrice}>₺{(product.price || product.Price || 0).toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── HIZLI ERİŞİM ─── */}
        <View style={[styles.section, { paddingBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#ECFDF5' }]} onPress={() => navigation.navigate('Products')}>
              <Text style={styles.quickIcon}>🛍</Text>
              <Text style={styles.quickLabel}>Ürünler</Text>
              <Text style={styles.quickSub}>Tüm ürünleri keşfet</Text>
            </TouchableOpacity>
            {isAuthenticated ? (
              <>
                <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#FEF3C7' }]} onPress={() => navigation.getParent()?.navigate('Sepet')}>
                  <Text style={styles.quickIcon}>🛒</Text>
                  <Text style={styles.quickLabel}>Sepetim</Text>
                  <Text style={styles.quickSub}>Alışverişi tamamla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#EFF6FF' }]} onPress={() => navigation.getParent()?.navigate('Siparisler')}>
                  <Text style={styles.quickIcon}>📋</Text>
                  <Text style={styles.quickLabel}>Siparişlerim</Text>
                  <Text style={styles.quickSub}>Takip ve detaylar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#F3E8FF' }]} onPress={() => navigation.getParent()?.navigate('Profil')}>
                  <Text style={styles.quickIcon}>👤</Text>
                  <Text style={styles.quickLabel}>Hesabım</Text>
                  <Text style={styles.quickSub}>Profil ayarları</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#FEF3C7' }]} onPress={() => navigation.getParent()?.navigate('Login')}>
                <Text style={styles.quickIcon}>🔑</Text>
                <Text style={styles.quickLabel}>Giriş Yap</Text>
                <Text style={styles.quickSub}>Hesabınıza erişin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  /* ─── HERO ─── */
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroOverlay: {
    alignItems: 'center',
  },
  heroTagline: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 4,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.surface,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  heroBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  heroBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },

  /* ─── SECTIONS ─── */
  section: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentDark,
  },

  /* ─── CATEGORY CARDS ─── */
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  /* ─── FEATURED PRODUCTS ─── */
  featuredCard: {
    width: width * 0.42,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.15)',
  },
  featuredImg: {
    width: '100%',
    height: 120,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredInfo: {
    padding: 10,
  },
  featuredStore: {
    fontSize: 9,
    color: colors.accentDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  featuredName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 17,
  },
  featuredPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },

  /* ─── QUICK ACCESS ─── */
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 14,
  },
  quickCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
