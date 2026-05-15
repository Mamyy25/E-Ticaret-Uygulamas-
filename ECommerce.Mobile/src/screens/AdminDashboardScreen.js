import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const SECTIONS = [
  { key: 'overview',      label: 'Genel',       icon: '📊' },
  { key: 'applications',  label: 'Başvurular',  icon: '📥' },
  { key: 'stores',        label: 'Mağazalar',   icon: '🏪' },
  { key: 'users',         label: 'Kullanıcılar',icon: '👥' },
  { key: 'reports',       label: 'Şikayetler',  icon: '🚩' },
  { key: 'appeals',       label: 'İtirazlar',   icon: '⚖️' },
];

const AdminDashboardScreen = () => {
  const { logout } = useContext(AuthContext);

  const [section, setSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState(null);

  const [stores, setStores]               = useState([]);
  const [users, setUsers]                 = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  const [openReports, setOpenReports]     = useState([]);
  const [pendingAppeals, setPendingAppeals] = useState([]);
  const [userSearch, setUserSearch]       = useState('');
  const [appealReplies, setAppealReplies] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const [storeRes, userRes, pendingRes, reportsRes, appealsRes] = await Promise.all([
        axios.get('/api/StoresApi?includeAll=true').catch(() => ({ data: [] })),
        axios.get('/api/AccountApi/admin/users').catch(() => ({ data: [] })),
        axios.get('/api/StoreApplicationsApi/pending').catch(() => ({ data: [] })),
        axios.get('/api/ReportsApi/admin?status=Open').catch(() => ({ data: [] })),
        axios.get('/api/AppealsApi/admin?status=Pending').catch(() => ({ data: [] })),
      ]);
      setStores(storeRes.data || []);
      setUsers(userRes.data || []);
      setPendingStores(pendingRes.data || []);
      setOpenReports(reportsRes.data || []);
      setPendingAppeals(appealsRes.data || []);
    } catch (e) {
      console.error('Admin fetch hatası:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  // ── Store işlemleri ────────────────────────────────────────
  const suspendStore = (store) => {
    Alert.prompt(
      'Mağazayı Askıya Al',
      `"${store.name}" için sebep girin:`,
      async (reason) => {
        if (!reason?.trim()) return;
        setActioning(`suspend-s${store.id}`);
        try {
          await axios.put(`/api/SuspensionsApi/stores/${store.id}`, { reason });
          setStores(prev => prev.map(s => s.id === store.id ? { ...s, status: 'Suspended' } : s));
        } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
        setActioning(null);
      },
      'plain-text'
    );
  };

  const liftStoreSuspension = async (storeId) => {
    setActioning(`lift-s${storeId}`);
    try {
      await axios.put(`/api/SuspensionsApi/stores/${storeId}/lift`);
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, status: 'Active' } : s));
    } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
    setActioning(null);
  };

  // ── Kullanıcı işlemleri ────────────────────────────────────
  const suspendUser = (u) => {
    Alert.prompt(
      'Kullanıcıyı Askıya Al',
      `"${u.fullName}" için sebep girin:`,
      async (reason) => {
        if (!reason?.trim()) return;
        setActioning(`suspend-u${u.id}`);
        try {
          await axios.put(`/api/SuspensionsApi/users/${u.id}`, { reason });
          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isSuspended: true, suspensionReason: reason } : x));
        } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
        setActioning(null);
      },
      'plain-text'
    );
  };

  const liftUserSuspension = async (userId) => {
    setActioning(`lift-u${userId}`);
    try {
      await axios.put(`/api/SuspensionsApi/users/${userId}/lift`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: false, suspensionReason: null, isActive: true } : u));
    } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
    setActioning(null);
  };

  // ── Başvuru işlemleri ──────────────────────────────────────
  const approveStore = async (storeId) => {
    setActioning(`approve-${storeId}`);
    try {
      await axios.put(`/api/StoreApplicationsApi/${storeId}/approve`);
      setPendingStores(prev => prev.filter(s => s.id !== storeId));
    } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
    setActioning(null);
  };

  const rejectStore = (store) => {
    Alert.prompt(
      'Başvuruyu Reddet',
      `"${store.name}" için ret sebebi girin:`,
      async (reason) => {
        if (!reason?.trim()) return;
        setActioning(`reject-${store.id}`);
        try {
          await axios.put(`/api/StoreApplicationsApi/${store.id}/reject`, { reason });
          setPendingStores(prev => prev.filter(s => s.id !== store.id));
        } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
        setActioning(null);
      },
      'plain-text'
    );
  };

  // ── Şikayet işlemleri ──────────────────────────────────────
  const resolveReport = async (reportId, dismiss = false) => {
    setActioning(`report-${reportId}`);
    try {
      await axios.put(`/api/ReportsApi/${reportId}/${dismiss ? 'dismiss' : 'resolve'}`, { adminNote: '' });
      setOpenReports(prev => prev.filter(r => r.id !== reportId));
    } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
    setActioning(null);
  };

  // ── İtiraz işlemleri ───────────────────────────────────────
  const respondAppeal = async (appealId, status) => {
    setActioning(`appeal-${appealId}`);
    try {
      await axios.put(`/api/AppealsApi/${appealId}/respond`, {
        adminResponse: appealReplies[appealId] || '',
        status,
      });
      setPendingAppeals(prev => prev.filter(a => a.id !== appealId));
    } catch { Alert.alert('Hata', 'İşlem başarısız.'); }
    setActioning(null);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const renderOverview = () => (
    <View>
      {/* Stat grid */}
      <View style={styles.statGrid}>
        {[
          { icon: '👥', label: 'Kullanıcı',    value: users.length,            color: '#A78BFA' },
          { icon: '🏪', label: 'Mağaza',        value: stores.length,           color: '#22D3EE' },
          { icon: '📥', label: 'Bekleyen Başv', value: pendingStores.length,    color: '#FB7185' },
          { icon: '🚩', label: 'Açık Şikayet',  value: openReports.length,      color: '#F472B6' },
          { icon: '⚖️', label: 'Bekl. İtiraz',  value: pendingAppeals.length,   color: '#FBBF24' },
          { icon: '🛡',  label: 'Askılı Kullanıcı', value: users.filter(u => u.isSuspended).length, color: '#FB7185' },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Text style={styles.statCardIcon}>{s.icon}</Text>
            <Text style={[styles.statCardValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statCardLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Oturumu Kapat</Text>
      </TouchableOpacity>
    </View>
  );

  const renderApplications = () => (
    <View>
      {pendingStores.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyIcon}>📥</Text><Text style={styles.emptyText}>Bekleyen başvuru yok</Text></View>
      ) : pendingStores.map(s => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.cardTitle}>{s.name}</Text>
          <Text style={styles.cardSub}>{s.seller?.fullName} · {s.seller?.email}</Text>
          <Text style={styles.cardMeta}>{s.storeType} · {new Date(s.createdAt).toLocaleDateString('tr-TR')}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGreen]}
              disabled={actioning === `approve-${s.id}`}
              onPress={() => approveStore(s.id)}
            >
              <Text style={styles.btnGreenText}>{actioning === `approve-${s.id}` ? '...' : 'Onayla'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnRed]}
              onPress={() => rejectStore(s)}
            >
              <Text style={styles.btnRedText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderStores = () => (
    <View>
      {stores.map(s => {
        const isSuspended = s.status === 'Suspended';
        return (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>{s.name}</Text>
              <View style={[styles.badge, { backgroundColor: isSuspended ? 'rgba(251,113,133,0.15)' : 'rgba(52,211,153,0.12)' }]}>
                <Text style={[styles.badgeTxt, { color: isSuspended ? '#FB7185' : '#34D399' }]}>
                  {isSuspended ? 'ASKIDA' : 'AKTİF'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{s.storeType} · {s.productCount || 0} ürün</Text>
            <View style={styles.actionRow}>
              {isSuspended ? (
                <TouchableOpacity
                  style={[styles.btn, styles.btnGreen, { flex: 1 }]}
                  disabled={actioning === `lift-s${s.id}`}
                  onPress={() => liftStoreSuspension(s.id)}
                >
                  <Text style={styles.btnGreenText}>{actioning === `lift-s${s.id}` ? '...' : 'Askı Kaldır'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, styles.btnRed, { flex: 1 }]}
                  disabled={actioning === `suspend-s${s.id}`}
                  onPress={() => suspendStore(s)}
                >
                  <Text style={styles.btnRedText}>Askıya Al</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderUsers = () => (
    <View>
      <TextInput
        style={styles.searchInput}
        placeholder="İsim veya e-posta ara..."
        placeholderTextColor={colors.textMuted}
        value={userSearch}
        onChangeText={setUserSearch}
      />
      {filteredUsers.map(u => (
        <View key={u.id} style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{u.fullName}</Text>
            {u.isSuspended && (
              <View style={[styles.badge, { backgroundColor: 'rgba(251,113,133,0.15)' }]}>
                <Text style={[styles.badgeTxt, { color: '#FB7185' }]}>ASKIDA</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSub}>{u.email}</Text>
          <Text style={styles.cardMeta}>{u.userType} · {new Date(u.createdAt).toLocaleDateString('tr-TR')}</Text>
          {u.isSuspended && u.suspensionReason && (
            <Text style={[styles.cardMeta, { color: '#FB7185' }]}>Sebep: {u.suspensionReason}</Text>
          )}
          {u.userType !== 'Admin' && (
            <View style={styles.actionRow}>
              {u.isSuspended ? (
                <TouchableOpacity
                  style={[styles.btn, styles.btnGreen, { flex: 1 }]}
                  disabled={actioning === `lift-u${u.id}`}
                  onPress={() => liftUserSuspension(u.id)}
                >
                  <Text style={styles.btnGreenText}>{actioning === `lift-u${u.id}` ? '...' : 'Askı Kaldır'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, styles.btnRed, { flex: 1 }]}
                  onPress={() => suspendUser(u)}
                >
                  <Text style={styles.btnRedText}>Askıya Al</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderReports = () => (
    <View>
      {openReports.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyIcon}>🚩</Text><Text style={styles.emptyText}>Açık şikayet yok</Text></View>
      ) : openReports.map(r => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(251,113,133,0.12)' }]}>
              <Text style={[styles.badgeTxt, { color: '#FB7185' }]}>{r.targetType}</Text>
            </View>
            <Text style={[styles.cardTitle, { flex: 1, marginLeft: 8 }]} numberOfLines={1}>{r.reason}</Text>
          </View>
          {r.description && <Text style={styles.cardSub} numberOfLines={2}>{r.description}</Text>}
          <Text style={styles.cardMeta}>{r.reporter?.fullName} · #{r.targetId} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGreen]}
              disabled={actioning === `report-${r.id}`}
              onPress={() => resolveReport(r.id, false)}
            >
              <Text style={styles.btnGreenText}>{actioning === `report-${r.id}` ? '...' : 'Çözdüm'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              disabled={actioning === `report-${r.id}`}
              onPress={() => resolveReport(r.id, true)}
            >
              <Text style={styles.btnGhostText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderAppeals = () => (
    <View>
      {pendingAppeals.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyIcon}>⚖️</Text><Text style={styles.emptyText}>Bekleyen itiraz yok</Text></View>
      ) : pendingAppeals.map(a => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardTitle}>{a.user?.fullName}</Text>
          <Text style={styles.cardSub}>{a.user?.email}</Text>
          {a.user?.suspensionReason && (
            <Text style={[styles.cardMeta, { color: '#FB7185' }]}>Askı: {a.user.suspensionReason}</Text>
          )}
          {a.store && <Text style={styles.cardMeta}>Mağaza: {a.store.name}</Text>}
          <View style={styles.appealMsgBox}>
            <Text style={styles.appealMsgText}>"{a.message}"</Text>
          </View>
          <TextInput
            style={styles.replyInput}
            placeholder="Cevap yazın (isteğe bağlı)..."
            placeholderTextColor={colors.textMuted}
            value={appealReplies[a.id] || ''}
            onChangeText={v => setAppealReplies(prev => ({ ...prev, [a.id]: v }))}
            multiline
          />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGreen]}
              disabled={actioning === `appeal-${a.id}`}
              onPress={() => respondAppeal(a.id, 'Approved')}
            >
              <Text style={styles.btnGreenText}>{actioning === `appeal-${a.id}` ? '...' : 'Onayla'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnRed]}
              disabled={actioning === `appeal-${a.id}`}
              onPress={() => respondAppeal(a.id, 'Denied')}
            >
              <Text style={styles.btnRedText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const CONTENT = {
    overview:     renderOverview,
    applications: renderApplications,
    stores:       renderStores,
    users:        renderUsers,
    reports:      renderReports,
    appeals:      renderAppeals,
  };

  const activeData = {
    applications: pendingStores.length,
    reports:      openReports.length,
    appeals:      pendingAppeals.length,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Yatay tab bar ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
        {SECTIONS.map(s => {
          const count = activeData[s.key];
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.tab, section === s.key && styles.tabActive]}
              onPress={() => setSection(s.key)}
            >
              <Text style={styles.tabIcon}>{s.icon}</Text>
              <Text style={[styles.tabLabel, section === s.key && styles.tabLabelActive]}>{s.label}</Text>
              {count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ─── İçerik ─── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.primary} />}
      >
        {CONTENT[section]?.()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  content:   { padding: 16, paddingBottom: 40 },

  // Tab bar
  tabBar:        { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, flexGrow: 0 },
  tab:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'transparent' },
  tabActive:     { backgroundColor: colors.primarySoft },
  tabIcon:       { fontSize: 14 },
  tabLabel:      { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tabLabelActive:{ color: colors.accent },
  tabBadge:      { backgroundColor: '#FB7185', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2 },
  tabBadgeText:  { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 14, borderTopWidth: 3,
    padding: 14, alignItems: 'center',
  },
  statCardIcon:  { fontSize: 20, marginBottom: 4 },
  statCardValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statCardLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textAlign: 'center', marginTop: 3 },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  cardRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSub:   { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  cardMeta:  { fontSize: 11, color: colors.textMuted },

  badge:    { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  badgeTxt: { fontSize: 10, fontWeight: '800' },

  // Buttons
  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn:          { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9, alignItems: 'center' },
  btnGreen:     { backgroundColor: 'rgba(52,211,153,0.14)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)' },
  btnGreenText: { color: '#34D399', fontWeight: '700', fontSize: 13 },
  btnRed:       { backgroundColor: 'rgba(251,113,133,0.12)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.35)' },
  btnRedText:   { color: '#FB7185', fontWeight: '700', fontSize: 13 },
  btnGhost:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
  btnGhostText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },

  // Search
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 10,
    color: colors.text, fontSize: 14,
    marginBottom: 12,
  },

  // Appeal
  appealMsgBox: {
    backgroundColor: 'rgba(167,139,250,0.07)',
    borderRadius: 10, padding: 10, marginTop: 4,
  },
  appealMsgText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, fontStyle: 'italic' },
  replyInput: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 10,
    color: colors.text, fontSize: 13,
    marginTop: 8, minHeight: 60,
  },

  // Empty
  emptyBox:  { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },

  logoutBtn: { marginTop: 12, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FB718540' },
  logoutText: { color: '#FB7185', fontWeight: '700', fontSize: 15 },
});

export default AdminDashboardScreen;
