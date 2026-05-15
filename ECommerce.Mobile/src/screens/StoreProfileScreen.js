import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const APPT_STATUS_META = {
  Pending:   { label: 'Bekliyor',    color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  Approved:  { label: 'Onaylandı',   color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  Completed: { label: 'Tamamlandı',  color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  Cancelled: { label: 'İptal',       color: '#FB7185', bg: 'rgba(251,113,133,0.12)' },
};

const StoreProfileScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [store, setStore]           = useState(null);
  const [appointments, setAppts]    = useState([]);
  const [requests, setRequests]     = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const [msgCount, setMsgCount]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState('appts');
  const [actioning, setActioning]   = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [storeRes, apptRes, reqRes, orderRes, msgRes] = await Promise.all([
        axios.get('/api/StoresApi/MyStore').catch(() => ({ data: null })),
        axios.get('/api/AppointmentsApi/for-my-store').catch(() => ({ data: [] })),
        axios.get('/api/CustomerRequestsApi').catch(() => ({ data: [] })),
        axios.get('/api/OrderApi/seller-orders').catch(() => ({ data: [] })),
        axios.get('/api/MessagesApi/list').catch(() => ({ data: [] })),
      ]);
      setStore(storeRes.data);
      setAppts(apptRes.data || []);
      setRequests(reqRes.data || []);
      setOrderCount(Array.isArray(orderRes.data) ? orderRes.data.length : 0);
      setMsgCount(Array.isArray(msgRes.data) ? msgRes.data.filter(m => m.unreadCount > 0).length : 0);
    } catch (e) {
      console.error('StoreProfile fetch hatası:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const updateApptStatus = async (apptId, status) => {
    setActioning(apptId);
    try {
      await axios.put(`/api/AppointmentsApi/${apptId}/status`, { status });
      setAppts(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
    } catch {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
    } finally {
      setActioning(null);
    }
  };

  const confirmAction = (apptId, status, label) => {
    Alert.alert(
      label,
      `Randevuyu "${label.toLowerCase()}" olarak işaretlemek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: label, style: status === 'Cancelled' ? 'destructive' : 'default', onPress: () => updateApptStatus(apptId, status) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const pendingAppts   = appointments.filter(a => a.status === 'Pending');
  const approvedAppts  = appointments.filter(a => a.status === 'Approved');
  const otherAppts     = appointments.filter(a => a.status !== 'Pending' && a.status !== 'Approved');
  const sortedAppts    = [...pendingAppts, ...approvedAppts, ...otherAppts];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.primary} />}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {store?.name?.charAt(0)?.toUpperCase() || '🏪'}
              </Text>
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.storeName} numberOfLines={1}>
                {store?.name || 'Mağazam'}
              </Text>
              <Text style={styles.storeType}>
                {store?.storeType === 'Service' ? '🔧 Yerel Esnaf' :
                 store?.storeType === 'Online'  ? '💻 Online Uzman' :
                 store?.storeType === 'Physical' ? '🏪 Fiziksel Mağaza' : ''}
              </Text>
            </View>
          </View>

          {/* Stat kutucukları */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Siparisler')}>
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Sipariş</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pendingAppts.length}</Text>
              <Text style={styles.statLabel}>Bekleyen Randevu</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Mesajlar')}>
              <Text style={styles.statValue}>{msgCount}</Text>
              <Text style={styles.statLabel}>Okunmamış Mesaj</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Hızlı Erişim ─── */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Siparisler')}>
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickLabel}>Siparişler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Mesajlar')}>
            <Text style={styles.quickIcon}>✉️</Text>
            <Text style={styles.quickLabel}>Mesajlar</Text>
            {msgCount > 0 && (
              <View style={styles.msgBadge}>
                <Text style={styles.msgBadgeText}>{msgCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('AnaSayfa')}>
            <Text style={styles.quickIcon}>🌐</Text>
            <Text style={styles.quickLabel}>Platformu Gör</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Tab Bar ─── */}
        <View style={styles.tabs}>
          {[
            { key: 'appts',    label: 'Randevular', count: appointments.length },
            { key: 'requests', label: 'Talepler',   count: requests.length },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
              {t.count > 0 && (
                <View style={[styles.tabBadge, activeTab === t.key && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{t.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Randevular Tab ─── */}
        {activeTab === 'appts' && (
          <View style={styles.section}>
            {sortedAppts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>Henüz randevu yok</Text>
              </View>
            ) : sortedAppts.map(appt => {
              const meta = APPT_STATUS_META[appt.status] || APPT_STATUS_META.Pending;
              const isActioning = actioning === appt.id;
              return (
                <View key={appt.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {appt.packageName || appt.productName || 'Randevu'}
                      </Text>
                      <Text style={styles.cardSub}>
                        {appt.customerName} · {new Date(appt.appointmentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  {/* Aksiyon butonları */}
                  {appt.status === 'Pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        disabled={isActioning}
                        onPress={() => updateApptStatus(appt.id, 'Approved')}
                      >
                        <Text style={styles.approveBtnText}>{isActioning ? '...' : 'Onayla'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        disabled={isActioning}
                        onPress={() => confirmAction(appt.id, 'Cancelled', 'İptal Et')}
                      >
                        <Text style={styles.cancelBtnText}>{isActioning ? '...' : 'İptal'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {appt.status === 'Approved' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn, { flex: 1 }]}
                        disabled={isActioning}
                        onPress={() => updateApptStatus(appt.id, 'Completed')}
                      >
                        <Text style={styles.approveBtnText}>{isActioning ? '...' : 'Tamamlandı İşaretle'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Müşteriye mesaj */}
                  {appt.customerId && (
                    <TouchableOpacity
                      style={styles.msgBtn}
                      onPress={() => navigation.navigate('Mesajlar', { screen: 'Chat', params: { userId: appt.customerId, userName: appt.customerName } })}
                    >
                      <Text style={styles.msgBtnText}>✉ Müşteriye Mesaj Gönder</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ─── Müşteri Talepleri Tab ─── */}
        {activeTab === 'requests' && (
          <View style={styles.section}>
            {requests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🔎</Text>
                <Text style={styles.emptyText}>Uygun müşteri talebi yok</Text>
              </View>
            ) : requests.map(req => (
              <View key={req.id} style={styles.card}>
                <Text style={styles.cardTitle} numberOfLines={2}>{req.title || req.description}</Text>
                <Text style={styles.cardSub}>
                  {req.cityName ? `📍 ${req.cityName} · ` : ''}
                  {req.budget ? `₺${req.budget?.toLocaleString('tr-TR')} bütçe` : 'Bütçe belirtilmemiş'}
                </Text>
                {req.description && req.title && (
                  <Text style={styles.cardDesc} numberOfLines={2}>{req.description}</Text>
                )}
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(167,139,250,0.12)', alignSelf: 'flex-start', marginTop: 8 }]}>
                  <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700' }}>
                    {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.canvas },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },

  // Header
  header: {
    backgroundColor: colors.surfaceRaised,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar:     { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.accent },
  storeName:  { fontSize: 18, fontWeight: '800', color: colors.text },
  storeType:  { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontWeight: '600' },

  statsRow:    { flexDirection: 'row', alignItems: 'center' },
  statBox:     { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue:   { fontSize: 20, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel:   { fontSize: 10, color: colors.textMuted, marginTop: 3, fontWeight: '600', textAlign: 'center' },

  // Hızlı erişim
  quickRow: { flexDirection: 'row', padding: 16, gap: 10 },
  quickBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSubtle, paddingVertical: 14, alignItems: 'center', position: 'relative' },
  quickIcon:  { fontSize: 22, marginBottom: 5 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  msgBadge:   { position: 'absolute', top: 8, right: 8, backgroundColor: '#FB7185', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  msgBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Tabs
  tabs:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, backgroundColor: colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.borderSubtle },
  tab:          { flex: 1, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive:    { backgroundColor: colors.primarySoft },
  tabText:      { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabTextActive:{ color: colors.accent },
  tabBadge:     { backgroundColor: colors.borderStrong, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: colors.primary },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Section + Cards
  section: { padding: 16, paddingTop: 8 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
    marginBottom: 12,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 3 },
  cardSub:    { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  cardDesc:   { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: 4 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },

  actionRow:  { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn:  { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  approveBtn: { backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)' },
  cancelBtn:  { backgroundColor: 'rgba(251,113,133,0.12)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.35)' },
  approveBtnText: { color: '#34D399', fontWeight: '700', fontSize: 13 },
  cancelBtnText:  { color: '#FB7185', fontWeight: '700', fontSize: 13 },

  msgBtn:     { marginTop: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center' },
  msgBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  emptyBox:  { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});

export default StoreProfileScreen;
