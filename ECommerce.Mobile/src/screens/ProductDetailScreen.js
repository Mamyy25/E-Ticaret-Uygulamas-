import React, { useContext, useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, Image, Animated, Alert, Dimensions, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Divider from '../components/Divider';
import Avatar from '../components/Avatar';

import { API_BASE } from '../config';
const API = API_BASE;
const { width: W } = Dimensions.get('window');
const IMG_H = W * 0.7;

export default function ProductDetailScreen({ route, navigation }) {
  const { product }   = route.params ?? {};
  const { user, isAuthenticated } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [added,        setAdded]        = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  // Giriş animasyonları
  const imgFade    = useRef(new Animated.Value(0)).current;
  const contentY   = useRef(new Animated.Value(40)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(imgFade,    { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(contentY,   { toValue: 0, friction: 7, useNativeDriver: true }),
        Animated.timing(contentFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const price       = product?.price || product?.Price || 0;
  const name        = product?.name  || product?.Name  || 'Ürün';
  const description = product?.description || product?.Description || '';
  const categoryName = product?.category?.name || '—';
  const storeName   = product?.store?.name;
  const stock       = product?.stock ?? product?.Stock ?? 0;
  const isDigital   = product?.isDigital ?? false;
  const fileType    = product?.fileType;
  const isService   = product?.isService === true;
  const isOutOfStock = !isService && !isDigital && stock <= 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Sepete eklemek için giriş yap.', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Giriş Yap', onPress: () => navigation.navigate('GirisYap') },
      ]);
      return;
    }
    setLoading(true);
    // Buton flaş animasyonu
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true, friction: 8 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, friction: 4 }),
    ]).start();
    try {
      await axios.post(`${API}/api/CartApi`, { productId: product.id || product.Id, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Sepete eklenemedi');
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'İndirmek için giriş yapmalısınız.', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Giriş Yap', onPress: () => navigation.navigate('GirisYap') },
      ]);
      return;
    }
    setDownloading(true);
    try {
      const res = await axios.get(`${API}/api/ProductsApi/${product.id || product.Id}/download`);
      const url = res.data?.downloadUrl;
      if (!url) { Alert.alert('Hata', 'İndirme linki bulunamadı.'); return; }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Bu dosya türü açılamıyor.');
      }
    } catch (e) {
      if (e.response?.status === 403) {
        Alert.alert('Satın Alınmamış', 'Bu dosyayı indirebilmek için önce satın almanız gerekiyor.', [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Sepete Ekle', onPress: handleAddToCart },
        ]);
      } else {
        Alert.alert('Hata', 'İndirme işlemi başlatılamadı.');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.body, color: colors.textMuted }}>Ürün bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Görsel ── */}
        <Animated.View style={[s.imgWrap, { opacity: imgFade }]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={s.img} resizeMode="cover" />
          ) : (
            <View style={s.imgFallback}>
              <Ionicons name={isDigital ? 'cloud-download-outline' : isService ? 'briefcase-outline' : 'cube-outline'} size={56} color={colors.textMuted} />
            </View>
          )}
        </Animated.View>

        {/* ── İçerik ── */}
        <Animated.View style={[s.content, { opacity: contentFade, transform: [{ translateY: contentY }] }]}>

          {/* Badge'ler */}
          <View style={s.badgeRow}>
            <Badge label={categoryName} variant="neutral" />
            {isDigital  && <Badge label="Dijital" variant="primary" dot />}
            {fileType   && <Badge label={fileType} variant="info" />}
            {isService  && <Badge label="Hizmet" variant="success" dot />}
            {isOutOfStock
              ? <Badge label="Tükendi" variant="danger" />
              : (!isService && !isDigital && <Badge label={`${stock} stok`} variant="success" dot />)
            }
          </View>

          {/* İsim */}
          <Text style={s.name}>{name}</Text>

          {/* Fiyat */}
          <Text style={s.price}>₺{price.toLocaleString()}</Text>

          <Divider style={{ marginVertical: space[4] }} />

          {/* Satıcı */}
          {storeName && (
            <View style={s.storeRow}>
              <Avatar name={storeName} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={s.storeLabel}>Satıcı</Text>
                <Text style={s.storeName}>{storeName}</Text>
              </View>
              {product.store?.sellerId && product.store.sellerId !== user?.id && (
                <TouchableOpacity
                  style={s.msgBtn}
                  onPress={() => navigation.navigate('Mesajlar')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                  <Text style={s.msgBtnTxt}>Mesaj</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Açıklama */}
          {description ? (
            <View style={s.descSection}>
              <Text style={s.descTitle}>Açıklama</Text>
              <Text style={s.descBody}>{description}</Text>
            </View>
          ) : null}

          <View style={{ height: 120 }} />
        </Animated.View>

      </ScrollView>

      {/* ── Sticky alt bar ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + space[3] }]}>
        <View>
          <Text style={s.bottomLabel}>{isService ? 'Hizmet Bedeli' : 'Fiyat'}</Text>
          <Text style={s.bottomPrice}>₺{price.toLocaleString()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: space[4], flexDirection: 'row', gap: space[2] }}>
          {isDigital && (
            <TouchableOpacity
              style={[s.downloadBtn, downloading && { opacity: 0.7 }]}
              onPress={handleDownload}
              disabled={downloading}
              activeOpacity={0.8}
            >
              <Ionicons name={downloading ? 'hourglass-outline' : 'cloud-download-outline'} size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: btnScale }] }]}>
            <Button
              label={
                isOutOfStock ? 'Tükendi' :
                added        ? '✓ Sepete Eklendi' :
                isService    ? 'Randevu Al →' :
                               'Sepete Ekle →'
              }
              onPress={handleAddToCart}
              variant={added ? 'secondary' : 'primary'}
              size="lg"
              fullWidth
              disabled={isOutOfStock}
              loading={loading}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  imgWrap: { width: W, height: IMG_H, backgroundColor: colors.surfaceRaised },
  img:     { width: '100%', height: '100%' },
  imgFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },

  content: { padding: space[5], gap: space[3] },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },

  name:  { fontFamily: fonts.display,  fontSize: fontSize.xl2, color: colors.text, lineHeight: fontSize.xl2 * 1.2 },
  price: { fontFamily: fonts.display,  fontSize: fontSize.xl3, color: colors.primary },

  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space[4],
  },
  storeLabel: { fontFamily: fonts.body,         fontSize: fontSize.xs,   color: colors.textMuted },
  storeName:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
  },
  msgBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },

  descSection: { gap: space[2] },
  descTitle:   { fontFamily: fonts.displayBold, fontSize: fontSize.md,  color: colors.text },
  descBody:    { fontFamily: fonts.body,        fontSize: fontSize.base, color: colors.textSecondary, lineHeight: fontSize.base * 1.65 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[5],
    paddingTop: space[4],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  bottomLabel: { fontFamily: fonts.body,    fontSize: fontSize.xs,   color: colors.textMuted },
  bottomPrice: { fontFamily: fonts.display, fontSize: fontSize.xl,   color: colors.primary },

  downloadBtn: {
    width: 48, height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center',
  },
});
