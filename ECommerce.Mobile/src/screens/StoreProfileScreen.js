import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const StoreProfileScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [activeSegment, setActiveSegment] = useState('inventory'); // inventory, marketing

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Mağaza Üst Bilgi Panel */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 32 }}>🏪</Text>
              </View>
              <View style={{ marginLeft: 15 }}>
                  <Text style={styles.storeName}>{user?.sub || 'Benim Mağazam'}</Text>
                  <View style={styles.badgeRow}>
                      <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>DOGRU SATICI</Text></View>
                  </View>
              </View>
          </View>
          
          <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>⭐ 4.9</Text>
                <Text style={styles.statLabel}>Mağaza Puanı</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>₺9.4k</Text>
                <Text style={styles.statLabel}>Toplam Kazanç</Text>
              </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
           <TouchableOpacity 
             style={[styles.tabBtn, activeSegment === 'inventory' && styles.tabBtnActive]} 
             onPress={() => setActiveSegment('inventory')}
           >
              <Text style={[styles.tabBtnText, activeSegment === 'inventory' && { color: '#fff' }]}>Envanter & İşlemler</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.tabBtn, activeSegment === 'marketing' && styles.tabBtnActive, { backgroundColor: activeSegment === 'marketing' ? colors.accentDark : colors.surface }]} 
             onPress={() => setActiveSegment('marketing')}
           >
              <Text style={[styles.tabBtnText, activeSegment === 'marketing' && { color: '#fff' }]}>Pazarlama & Büyüme</Text>
           </TouchableOpacity>
        </View>

        {activeSegment === 'inventory' ? (
            <View style={styles.section}>
                <TouchableOpacity style={styles.mainActionBtn}>
                    <Text style={styles.mainActionBtnText}>➕ YENİ ÜRÜN VEYA HİZMET EKLE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Siparisler')}>
                    <Text style={styles.actionIcon}>📋</Text>
                    <View>
                        <Text style={styles.actionTitle}>Gelen Siparişler</Text>
                        <Text style={styles.actionSubtitle}>Bekleyen ve tamamlanan tüm işlemler</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Mesajlar')}>
                    <Text style={styles.actionIcon}>✉️</Text>
                    <View>
                        <Text style={styles.actionTitle}>Müşteri Mesajları</Text>
                        <Text style={styles.actionSubtitle}>Soru ve destek taleplerini yanıtlayın</Text>
                    </View>
                </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.section}>
                <View style={styles.marketingAlert}>
                   <Text style={styles.marketingAlertTitle}>Büyümeye Hazır Mısın? 🚀</Text>
                   <Text style={styles.marketingAlertText}>Müşterilerinize özel sadakat programları oluşturun ve anlık hikayelerle güven kazanın.</Text>
                </View>

                <TouchableOpacity style={[styles.actionItem, { borderColor: colors.accentDark }]} onPress={() => Alert.alert("Kamera", "Canlı çalışma hikayesi yükleme ekranı açıldı!")}>
                    <Text style={styles.actionIcon}>📸</Text>
                    <View>
                        <Text style={[styles.actionTitle, { color: colors.accentDark }]}>Hizmet Hikayesi Paylaş</Text>
                        <Text style={styles.actionSubtitle}>Anasayfada o anki işinizi canlı gösterin</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Sadakat", "Sadakat programı (Mühür Kartı) ayarları açıldı!")}>
                    <Text style={styles.actionIcon}>⭐</Text>
                    <View>
                        <Text style={styles.actionTitle}>Sadakat Programı (Mühür Kartı)</Text>
                        <Text style={styles.actionSubtitle}>"5 Alıma 1 Bedava" gibi kurallar tanımlayın</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionItem, { borderStyle: 'dashed' }]} onPress={() => Alert.alert("Talepler", "Yakınınızdaki alıcı talepleri listeleniyor!")}>
                    <Text style={styles.actionIcon}>🔎</Text>
                    <View>
                        <Text style={styles.actionTitle}>Müşteri Taleplerini Gör</Text>
                        <Text style={styles.actionSubtitle}>İhtiyacını yazan kullanıcılara teklif gönderin</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  storeName: { fontSize: 20, fontWeight: '900', color: '#fff' },
  badgeRow: { flexDirection: 'row', marginTop: 5 },
  verifiedBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  verifiedText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: -25, backgroundColor: colors.surface, borderRadius: 15, padding: 6, elevation: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: colors.primary },
  tabBtnText: { fontSize: 12, fontWeight: '800', color: colors.textMuted },

  section: { padding: 20, paddingTop: 30 },
  mainActionBtn: { backgroundColor: colors.accentDark, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20, elevation: 5 },
  mainActionBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  marketingAlert: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: colors.accentDark },
  marketingAlertTitle: { fontSize: 15, fontWeight: '900', color: colors.accentDark },
  marketingAlertText: { fontSize: 11, color: '#3b82f6', marginTop: 5, lineHeight: 18 },

  actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 20, borderRadius: 18, marginBottom: 15, borderWidth: 1, borderColor: colors.border, gap: 15 },
  actionIcon: { fontSize: 28 },
  actionTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  actionSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 4 }
});

export default StoreProfileScreen;
