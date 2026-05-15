import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image
} from 'react-native';
import axios from 'axios';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

const ProviderProfileScreen = ({ route, navigation }) => {
  const { storeId } = route.params || {};
  const { isAuthenticated } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('services');

  useEffect(() => {
    fetchProfile();
  }, [storeId]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/StoresApi/${storeId}/profile`);
      setProfile(res.data);
    } catch (e) {
      console.error('Profil hatası:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (packageId) => {
    if (!isAuthenticated) { navigation.navigate('Login'); return; }
    navigation.navigate('Booking', { storeId, packageId });
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>;
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Profil bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.cover}>
          {profile.bannerImageUrl
            ? <Image source={{ uri: profile.bannerImageUrl }} style={styles.coverImg} />
            : <View style={styles.coverGrad} />
          }
        </View>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            {profile.profileImageUrl
              ? <Image source={{ uri: profile.profileImageUrl }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{profile.name?.[0]?.toUpperCase()}</Text>
            }
          </View>

          <Text style={styles.title}>{profile.name}</Text>
          <Text style={styles.providerLine}>
            {profile.providerName}
            {profile.providerCity ? ` · ${profile.providerCity}` : ''}
            {profile.yearsOfExperience ? ` · ${profile.yearsOfExperience} yıl` : ''}
          </Text>

          <View style={styles.metaRow}>
            {profile.averageRating != null && (
              <Text style={styles.rating}>★ {profile.averageRating.toFixed(1)} <Text style={styles.rev}>({profile.reviewCount})</Text></Text>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {profile.storeType === 'Service' ? 'Yerel Esnaf' :
                 profile.storeType === 'Online'  ? 'Online' :
                 profile.storeType === 'Physical' ? 'Mağaza' : profile.storeType}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'services', label: 'Hizmetler' },
            { key: 'about',    label: 'Hakkında' },
            { key: 'reviews',  label: 'Yorumlar' },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* İçerik */}
        <View style={{ padding: 16, paddingBottom: 100 }}>
          {tab === 'services' && (
            <View>
              {profile.servicePackages?.length === 0 && (
                <Text style={styles.empty}>Henüz hizmet paketi yok.</Text>
              )}
              {profile.servicePackages?.map(pkg => (
                <View key={pkg.id} style={styles.serviceCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName}>{pkg.name}</Text>
                      {pkg.isFeatured && <Text style={styles.featured}>Öne Çıkan</Text>}
                    </View>
                    <Text style={styles.serviceDesc} numberOfLines={2}>{pkg.description}</Text>
                    <Text style={styles.duration}>{pkg.durationMinutes} dk</Text>
                  </View>
                  <View style={styles.serviceRight}>
                    <Text style={styles.servicePrice}>{pkg.price.toLocaleString('tr-TR')}₺</Text>
                    <TouchableOpacity onPress={() => handleBook(pkg.id)} style={styles.serviceBtn}>
                      <Text style={styles.serviceBtnText}>Seç</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === 'about' && (
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>{profile.description || 'Açıklama eklenmemiş.'}</Text>
              <Text style={styles.aboutMeta}>
                Aramıza katıldı: {new Date(profile.providerJoinedAt).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}

          {tab === 'reviews' && (
            <Text style={styles.empty}>Yorumlar yakında.</Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity onPress={() => handleBook()} style={styles.cta}>
          <Text style={styles.ctaText}>Rezervasyon Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.canvas },
  empty:     { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

  cover:    { height: 180 },
  coverImg: { width: '100%', height: '100%' },
  coverGrad: { width: '100%', height: '100%', backgroundColor: colors.surfaceRaised },

  headerCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16, marginTop: -40,
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.surface,
    marginTop: -50, marginBottom: 12,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 16 },
  avatarText: { color: 'white', fontSize: 32, fontWeight: '700' },

  title:        { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  providerLine: { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  rating:  { color: colors.warning, fontWeight: '700', fontSize: 14 },
  rev:     { color: colors.textMuted, fontWeight: '400' },
  typeBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },

  tabs: { flexDirection: 'row', marginTop: 24, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tab:  { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText:    { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: colors.accent },

  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.borderSubtle,
    flexDirection: 'row', gap: 12,
  },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceName:   { fontSize: 15, fontWeight: '700', color: colors.text },
  featured:      { fontSize: 10, fontWeight: '700', color: colors.warning, backgroundColor: colors.warningSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  serviceDesc:   { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  duration:      { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  serviceRight:  { alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  servicePrice:  { fontSize: 16, fontWeight: '700', color: colors.text },
  serviceBtn:    { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  serviceBtnText: { color: colors.accent, fontSize: 12, fontWeight: '700' },

  aboutCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: 12, padding: 16 },
  aboutText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  aboutMeta: { fontSize: 12, color: colors.textMuted, marginTop: 12 },

  stickyBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
    padding: 16, paddingBottom: 24,
  },
  cta:     { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  ctaText: { color: 'white', fontSize: 15, fontWeight: '700' },
});

export default ProviderProfileScreen;
