import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const GatewayScreen = ({ navigation }) => {
  const { user, userMode, setUserMode } = useContext(AuthContext);

  // userMode değiştiğinde AppNavigator otomatik olarak
  // BuyerTabs veya SellerTabs'a geçiş yapacak.

  const selectMode = (mode) => {
    setUserMode(mode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>Hoş Geldiniz!</Text>
        <Text style={styles.name}>{user?.name || user?.sub || 'Satıcı'}</Text>
        <Text style={styles.subtitle}>Platforma nasıl devam etmek istediğinizi seçin:</Text>

        <View style={styles.cardsRow}>
          {/* Platform / Alışveriş */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.85}
            onPress={() => selectMode('buyer')}
          >
            <Text style={styles.cardIcon}>🛍️</Text>
            <Text style={styles.cardTitle}>Platform</Text>
            <Text style={styles.cardSubtitle}>Mağazaları gezin, diğer satıcılarla görüşün ve sipariş verin.</Text>
          </TouchableOpacity>

          {/* Mağazam / Yönetim */}
          <TouchableOpacity 
            style={[styles.card, styles.cardSeller]} 
            activeOpacity={0.85}
            onPress={() => selectMode('seller')}
          >
            <Text style={styles.cardIcon}>🏪</Text>
            <Text style={[styles.cardTitle, { color: '#4F46E5' }]}>Mağazam</Text>
            <Text style={styles.cardSubtitle}>Siparişlerinizi takip edin, ilan ekleyin ve işletmenizi yönetin.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GatewayScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  welcome: { fontSize: 16, color: colors.textMuted, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 8, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
  cardsRow: { width: '100%', gap: 16 },
  card: {
    width: '100%', padding: 28, backgroundColor: colors.surface,
    borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardSeller: { backgroundColor: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.15)' },
  cardIcon: { fontSize: 48, marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  cardSubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
});
