import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = () => {
    const { logout } = useContext(AuthContext);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeSection, setActiveSection] = useState('dashboard'); // dashboard, stores, users, reports

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchStores();
        return () => clearInterval(timer);
    }, []);

    const fetchStores = async () => {
        try {
            const res = await axios.get('/api/StoresApi');
            setStores(res.data || []);
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const renderDashboard = () => (
        <View style={styles.animateContainer}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.welcomeText}>Hoş Geldin, Super Admin</Text>
                    <Text style={styles.timeText}>
                        {currentTime.toLocaleTimeString('tr-TR')} | {currentTime.toLocaleDateString('tr-TR')}
                    </Text>
                </View>
                <TouchableOpacity style={styles.notifBtn} onPress={() => setActiveSection('reports')}>
                    <Text style={{ fontSize: 24 }}>🔔</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
                </TouchableOpacity>
            </View>

            <View style={styles.moduleGrid}>
                <TouchableOpacity style={[styles.moduleCard, { borderBottomColor: colors.primary }]} onPress={() => setActiveSection('stores')}>
                    <Text style={styles.moduleIcon}>🏪</Text>
                    <Text style={styles.moduleTitle}>Mağaza Denetimi</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.moduleCard, { borderBottomColor: colors.success }]} onPress={() => setActiveSection('users')}>
                    <Text style={styles.moduleIcon}>👥</Text>
                    <Text style={styles.moduleTitle}>Kullanıcılar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.moduleCard, { borderBottomColor: colors.danger }]} onPress={() => setActiveSection('reports')}>
                    <Text style={styles.moduleIcon}>🚩</Text>
                    <Text style={styles.moduleTitle}>Şikayetler</Text>
                </TouchableOpacity>
            </View>


            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Mağaza Sağlık Özeti</Text>
                {stores.slice(0, 3).map(s => (
                    <View key={s.id} style={styles.listRow}>
                        <Text style={styles.listTextName}>{s.name}</Text>
                        <Text style={[styles.listTextStatus, { color: s.isActive ? colors.success : colors.danger }]}>
                            {s.isActive ? 'AKTİF' : 'BEKLEMEDE'}
                        </Text>
                        <Text style={styles.listTextPrice}>₺{s.totalSales || 0}</Text>
                    </View>
                ))}
            </View>
            
            <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
                <Text style={styles.logoutText}>Oturumu Kapat</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStores = () => (
        <View style={styles.animateContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveSection('dashboard')}>
                <Text style={styles.backBtnText}>← Dashboard'a Dön</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Sistemdeki Tüm Mağazalar</Text>
            {stores.map(store => (
                <View key={store.id} style={styles.storeDetailCard}>
                    <View style={styles.storeHeader}>
                        <Text style={styles.storeTitle}>{store.name}</Text>
                        <Text style={[styles.statusTag, { backgroundColor: store.isActive ? '#dcfce7' : '#fee2e2' }]}>
                            {store.isActive ? 'AKTİF' : 'ASKIDA'}
                        </Text>
                    </View>
                    <Text style={styles.storeInfoText}>Sahip: {store.ownerName || 'Bilinmiyor'}</Text>
                    <View style={styles.storeStats}>
                        <View style={styles.miniStat}>
                            <Text style={styles.statLabel}>PUAN</Text>
                            <Text style={styles.statVal}>⭐ {store.rating || '0.0'}</Text>
                        </View>
                        <View style={styles.miniStat}>
                            <Text style={styles.statLabel}>BU AYKI SATIŞ</Text>
                            <Text style={styles.statVal}>₺{store.totalSales || 0}</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {activeSection === 'dashboard' ? renderDashboard() : 
                 activeSection === 'stores' ? renderStores() : null}
                
                {(activeSection === 'users' || activeSection === 'reports') && (
                    <View style={styles.animateContainer}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveSection('dashboard')}>
                            <Text style={styles.backBtnText}>← Dashboard'a Dön</Text>
                        </TouchableOpacity>
                        <Text style={styles.sectionTitle}>{activeSection === 'users' ? 'Kullanıcı Yönetimi' : '🚩 İstek & Şikayetlar'}</Text>
                        <View style={styles.emptyCard}>
                            <Text style={{ fontSize: 40, marginBottom: 15 }}>⚙️</Text>
                            <Text style={styles.emptyText}>Bu modül test veritabanı temizlendiği için boştur. Gerçek istekler geldiğinde burada listelenecektir.</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingBottom: 40 },
    animateContainer: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    welcomeText: { fontSize: 22, fontWeight: '800', color: colors.text },
    timeText: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 4 },
    notifBtn: { width: 50, height: 50, backgroundColor: colors.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    badge: { position: 'absolute', top: -5, right: -5, backgroundColor: colors.danger, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
    moduleCard: { width: (width - 52) / 2, backgroundColor: colors.surface, padding: 20, borderRadius: 16, elevation: 4, borderBottomWidth: 4 },
    moduleIcon: { fontSize: 32, marginBottom: 10 },
    moduleTitle: { fontSize: 13, fontWeight: '800', color: colors.text },

    card: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, elevation: 2, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 15 },
    listRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    listTextName: { fontSize: 14, fontWeight: '700', flex: 2 },
    listTextStatus: { fontSize: 11, fontWeight: '800', flex: 1, textAlign: 'center' },
    listTextPrice: { fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right' },

    backBtn: { marginBottom: 20, paddingVertical: 8 },
    backBtnText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
    storeDetailCard: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, marginBottom: 15, elevation: 2 },
    storeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    storeTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    storeInfoText: { fontSize: 13, color: colors.textMuted, marginBottom: 15 },
    storeStats: { flexDirection: 'row', gap: 30 },
    miniStat: { gap: 4 },
    statLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
    statVal: { fontSize: 14, fontWeight: '800' },

    emptyCard: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { textAlign: 'center', color: colors.textMuted, lineHeight: 20 },
    logoutBtn: { marginTop: 20, padding: 18, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.danger },
    logoutText: { color: colors.danger, fontWeight: '800', fontSize: 16 }
});
