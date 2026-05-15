import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await axios.get('/api/ProductsApi');
      const catRes = await axios.get('/api/CategoriesApi');
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Kullanıcı';

  const renderWelcomeDashboard = () => (
    <View style={styles.dashCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.welcomeText}>Hoş geldiniz, {firstName} 👋</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Bugün ne yapmak istersiniz?</Text>
      </View>
    </View>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Personalized Header or Guest Hero */}
        <View style={{ paddingHorizontal: 20 }}>
            {isAuthenticated ? renderWelcomeDashboard() : (
                <View style={styles.guestHero}>
                    <Text style={styles.guestTitle}>EŞSİZ HİZMETLERİ KEŞFET</Text>
                    <Text style={styles.guestSubtitle}>Mağazaların hikayelerine göz at ve en iyi teklifi al.</Text>
                </View>
            )}
        </View>

        {/* Reverse Shopping Banner */}
        <TouchableOpacity style={styles.reverseShopBanner} onPress={() => Alert.alert("Tersine Alışveriş", "Talebiniz yayınlanmak üzere hazır! (Modül Aktif)")}>
            <View style={{ flex: 1 }}>
                <Text style={styles.reverseTitle}>🔍 Bulamadın mı?</Text>
                <Text style={styles.reverseSubtitle}>İhtiyacını yaz, binlerce usta sana teklif versin.</Text>
            </View>
            <View style={styles.reverseBtn}>
                <Text style={styles.reverseBtnText}>TALEP AÇ</Text>
            </View>
        </TouchableOpacity>

        {/* Categories Scroller */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={styles.catBtn} onPress={() => Alert.alert("Kategori", `${cat.name} kategorisi filtrelendi.`)}>
                    <Text style={styles.catBtnText}>{cat.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>



        {/* Product Grid */}
        <View style={{ padding: 10 }}>
            <Text style={styles.sectionTitle}>Sizin İçin Seçtiklerimiz</Text>
            <View style={styles.productGrid}>
                {products.map((item, i) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.productCard}
                        onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    >
                        <View style={styles.imgContainer}>
                           {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.productImg} /> : <View style={styles.noImg}><Text style={{ fontSize: 10 }}>GÖRSEL YOK</Text></View>}
                           {item.store && (
                              <View style={styles.storeTag}>
                                 <Text style={styles.storeTagText}>🏪 {item.store.name}</Text>
                              </View>
                           )}
                        </View>
                        <Text style={styles.productTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.productPrice}>₺{item.price.toLocaleString()}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {products.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={{ fontSize: 40 }}>🛒</Text>
                    <Text style={styles.emptyText}>Henüz ürün eklenmemiş. Mağazanızı oluşturup ilk ürününüzü ekleyin!</Text>
                </View>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  storiesContainer: { paddingVertical: 15, paddingLeft: 20, backgroundColor: colors.background },
  storyItem: { alignItems: 'center', marginRight: 15 },
  storyCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: colors.success, padding: 3, justifyContent: 'center', alignItems: 'center' },
  storyImg: { width: '100%', height: '100%', borderRadius: 36 },
  storyName: { fontSize: 10, fontWeight: '800', marginTop: 5, color: colors.text },

  dashCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 25, flexDirection: 'row', alignItems: 'center', marginVertical: 10, elevation: 8 },
  welcomeText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  dashStats: { flexDirection: 'row', marginTop: 15, gap: 20 },
  statItem: { alignItems: 'center' },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  dashBadge: { position: 'absolute', top: 20, right: 20, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

  guestHero: { paddingVertical: 30, alignItems: 'center' },
  guestTitle: { fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center' },
  guestSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 5, textAlign: 'center' },

  reverseShopBanner: { backgroundColor: '#fef3c7', margin: 20, padding: 20, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d97706', flexDirection: 'row', alignItems: 'center' },
  reverseTitle: { fontSize: 15, fontWeight: '900', color: '#92400e' },
  reverseSubtitle: { fontSize: 11, color: '#b45309', marginTop: 4 },
  reverseBtn: { backgroundColor: '#d97706', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  reverseBtnText: { color: '#fff', fontWeight: '900', fontSize: 10 },

  sectionHeader: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  catScroll: { paddingLeft: 20, marginTop: 10, marginBottom: 20 },
  catBtn: { backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginRight: 10, elevation: 2 },
  catBtnText: { fontSize: 12, fontWeight: '800', color: colors.text },

  tipsContainer: { padding: 20 },
  tipCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.primary, elevation: 2 },
  tipTitle: { fontSize: 14, fontWeight: '900' },
  tipText: { fontSize: 12, color: colors.textMuted, marginTop: 5 },

  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 10 },
  productCard: { width: (width - 40) / 2, backgroundColor: colors.surface, borderRadius: 16, elevation: 3, marginBottom: 15 },
  imgContainer: { height: 160, width: '100%', position: 'relative' },
  productImg: { width: '100%', height: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  noImg: { height: '100%', width: '100%', backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  storeTag: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 4, borderRadius: 4 },
  storeTagText: { fontSize: 9, fontWeight: '900', color: colors.primary },
  productTitle: { fontSize: 13, fontWeight: '800', padding: 10, paddingBottom: 2 },
  productPrice: { fontSize: 14, fontWeight: '900', color: colors.primary, paddingHorizontal: 10, paddingBottom: 15 },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', fontSize: 14, color: colors.textMuted, marginTop: 15, lineHeight: 22 }
});

export default HomeScreen;
