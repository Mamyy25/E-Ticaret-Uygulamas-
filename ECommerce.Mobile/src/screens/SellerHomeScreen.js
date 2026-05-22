import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import SectionHeader from '../components/SectionHeader';

// ─── Yardımcı animasyon ───────────────────────────────────────
function useReveal() {
  const anim = useRef(new Animated.Value(0)).current;
  const go   = () => Animated.spring(anim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
  const style = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };
  return { go, style };
}

const APPT_STATUS = {
  Pending:   { label: 'Bekliyor',   color: colors.warning, bg: colors.warningSoft },
  Approved:  { label: 'Onaylandı',  color: colors.success, bg: colors.successSoft },
  Completed: { label: 'Tamamlandı', color: colors.primary, bg: colors.primarySoft },
  Cancelled: { label: 'İptal',      color: colors.danger,  bg: colors.dangerSoft },
};

const STORE_TYPE_LABEL = {
  Service:  'Hizmet Sağlayıcı',
  Online:   'Online Uzman',
  Physical: 'Ürün Mağazası',
};

// ─── İstatistik kartı ─────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, onPress }) {
  return (
    <TouchableOpacity style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View style={[s.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statVal}>{value ?? '—'}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Randevu satırı ───────────────────────────────────────────
function ApptRow({ appt, onPress }) {
  const meta = APPT_STATUS[appt.status] ?? APPT_STATUS.Pending;
  const date = appt.appointmentDate
    ? new Date(appt.appointmentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
  return (
    <TouchableOpacity style={s.apptRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.apptDot, { backgroundColor: meta.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.apptTitle} numberOfLines={1}>{appt.packageName || appt.productName || 'Randevu'}</Text>
        <Text style={s.apptMeta}>{appt.customerName} · {date}</Text>
      </View>
      <View style={[s.apptBadge, { backgroundColor: meta.bg }]}>
        <Text style={[s.apptBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Talep satırı ─────────────────────────────────────────────
function ReqRow({ req }) {
  return (
    <View style={s.reqRow}>
      <View style={s.reqIconWrap}>
        <Ionicons name="bulb-outline" size={16} color={colors.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.reqTitle} numberOfLines={1}>{req.title}</Text>
        <View style={s.reqMeta}>
          {req.city && <Text style={s.reqMetaTxt}>📍 {req.city}</Text>}
          {req.budget && <Text style={s.reqMetaTxt}> · ₺{req.budget} bütçe</Text>}
          {req.categoryHint && <Text style={s.reqMetaTxt}> · {req.categoryHint}</Text>}
        </View>
      </View>
      <Text style={s.reqDate}>
        {new Date(req.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
      </Text>
    </View>
  );
}

// ─── Ana ekran ────────────────────────────────────────────────
export default function SellerHomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets   = useSafeAreaInsets();

  const [store,        setStore]        = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [requests,     setRequests]     = useState([]);
  const [productCount, setProductCount] = useState(null);
  const [serviceCount, setServiceCount] = useState(null);
  const [unreadMsgs,   setUnreadMsgs]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const headerReveal = useReveal();
  const statsReveal  = useReveal();
  const actReveal    = useReveal();
  const apptReveal   = useReveal();
  const reqReveal    = useReveal();

  const fetchData = useCallback(async () => {
    try {
      const [storeRes, apptRes, reqRes, msgRes] = await Promise.all([
        axios.get('/api/StoresApi/MyStore').catch(() => ({ data: null })),
        axios.get('/api/AppointmentsApi/for-my-store').catch(() => ({ data: [] })),
        axios.get('/api/CustomerRequestsApi').catch(() => ({ data: [] })),
        axios.get('/api/MessagesApi/list').catch(() => ({ data: [] })),
      ]);

      const storeData = storeRes.data;
      setStore(storeData);
      setAppointments(apptRes.data ?? []);
      setRequests((reqRes.data ?? []).filter(r => r.isActive ?? true));
      setUnreadMsgs((msgRes.data ?? []).filter(m => !m.isRead).length);

      if (storeData?.id) {
        const [prdRes, svcRes] = await Promise.all([
          axios.get(`/api/ProductsApi?storeId=${storeData.id}`).catch(() => ({ data: [] })),
          axios.get('/api/ServicePackagesApi/mine').catch(() => ({ data: [] })),
        ]);
        setProductCount((prdRes.data ?? []).length);
        setServiceCount((svcRes.data ?? []).filter(s => s.isActive).length);
      }
    } catch (e) {
      console.error('SellerHome fetch:', e.message);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
    headerReveal.go();
    setTimeout(() => { statsReveal.go(); actReveal.go(); }, 100);
    setTimeout(() => { apptReveal.go(); reqReveal.go(); }, 200);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || '';

  const pendingAppts  = appointments.filter(a => a.status === 'Pending');
  const recentAppts   = [...pendingAppts, ...appointments.filter(a => a.status !== 'Pending')].slice(0, 4);
  const recentReqs    = requests.slice(0, 3);

  const STATS = [
    { icon: 'calendar-outline',   label: 'Bekleyen Randevu',  value: pendingAppts.length,   color: colors.warning, bg: colors.warningSoft,  onPress: () => navigation.navigate('StoreManage', { tab: 'appts' }) },
    { icon: 'bulb-outline',       label: 'Aktif Talep',       value: requests.length,        color: colors.info,    bg: colors.infoSoft,     onPress: () => navigation.navigate('StoreManage', { tab: 'requests' }) },
    { icon: 'cube-outline',       label: 'Toplam Ürün',       value: productCount,           color: colors.primary, bg: colors.primarySoft,  onPress: () => navigation.navigate('StoreManage') },
    { icon: 'chatbubbles-outline',label: 'Okunmamış Mesaj',   value: unreadMsgs,             color: colors.success, bg: colors.successSoft,  onPress: () => navigation.navigate('Mesajlar') },
  ];

  const QUICK_ACTIONS = [
    { icon: 'add-circle-outline', label: 'Ürün Ekle',   color: colors.primary, bg: colors.primarySoft,
      onPress: () => navigation.navigate('Magazam', { screen: 'StorePublicView', params: { openSheet: 'product' } }) },
    { icon: 'briefcase-outline',  label: 'Hizmet Ekle', color: colors.success, bg: colors.successSoft,
      onPress: () => navigation.navigate('Magazam', { screen: 'StorePublicView', params: { openSheet: 'service' } }) },
    { icon: 'receipt-outline',    label: 'Siparişler',  color: colors.info,    bg: colors.infoSoft,
      onPress: () => navigation.navigate('Siparisler') },
    { icon: 'people-outline',     label: 'Talepler',    color: colors.warning, bg: colors.warningSoft,
      onPress: () => navigation.navigate('StoreManage', { tab: 'requests' }) },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: space[12] }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* ── Header ── */}
      <Animated.View style={headerReveal.style}>
        <LinearGradient
          colors={['rgba(70,72,212,0.10)', 'rgba(70,72,212,0.03)', 'transparent']}
          style={[s.header, { paddingTop: insets.top + space[4] }]}
        >
          <View style={s.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
              {loading ? (
                <SkeletonBox width={180} height={20} style={{ marginTop: 4 }} />
              ) : (
                <View style={s.storeRow}>
                  <Text style={s.storeName} numberOfLines={1}>{store?.name ?? 'Mağazam'}</Text>
                  {store?.storeType ? (
                    <View style={s.typeBadge}>
                      <Text style={s.typeBadgeTxt}>{STORE_TYPE_LABEL[store.storeType] ?? store.storeType}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {/* Mesaj / bildirim */}
            <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('Mesajlar')} activeOpacity={0.7}>
              <Ionicons name="chatbubbles-outline" size={21} color={colors.text} />
              {unreadMsgs > 0 && <View style={s.notifDot} />}
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </Animated.View>

      {/* ── İstatistikler ── */}
      <Animated.View style={[s.section, statsReveal.style]}>
        <SectionHeader title="Genel Bakış" />
        {loading ? (
          <View style={s.statsGrid}>
            {[1, 2, 3, 4].map(i => <SkeletonBox key={i} width={(styles?.statCard?.width) ?? '47%'} height={88} />)}
          </View>
        ) : (
          <View style={s.statsGrid}>
            {STATS.map(st => (
              <StatCard key={st.label} {...st} />
            ))}
          </View>
        )}
      </Animated.View>

      {/* ── Hızlı Aksiyonlar ── */}
      <Animated.View style={[s.section, actReveal.style]}>
        <SectionHeader title="Hızlı İşlemler" />
        <View style={s.quickRow}>
          {QUICK_ACTIONS.map(qa => (
            <TouchableOpacity key={qa.label} style={s.quickCard} onPress={qa.onPress} activeOpacity={0.8}>
              <View style={[s.quickIconWrap, { backgroundColor: qa.bg }]}>
                <Ionicons name={qa.icon} size={20} color={qa.color} />
              </View>
              <Text style={s.quickLabel}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ── Bekleyen Randevular ── */}
      <Animated.View style={[s.section, apptReveal.style]}>
        <SectionHeader
          title="Randevular"
          action={appointments.length > 0 ? 'Tümü →' : undefined}
          onAction={() => navigation.navigate('StoreManage', { tab: 'appts' })}
        />
        {loading ? (
          <View style={{ gap: space[2] }}>
            <SkeletonBox width="100%" height={60} />
            <SkeletonBox width="100%" height={60} />
          </View>
        ) : recentAppts.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="calendar-outline" size={26} color={colors.textMuted} />
            <Text style={s.emptyTxt}>Henüz randevu yok</Text>
          </View>
        ) : (
          <View style={s.card}>
            {recentAppts.map((appt, i) => (
              <View key={appt.id}>
                <ApptRow appt={appt} onPress={() => navigation.navigate('StoreManage', { tab: 'appts' })} />
                {i < recentAppts.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* ── Müşteri Talepleri ── */}
      <Animated.View style={[s.section, reqReveal.style]}>
        <SectionHeader
          title="Müşteri Talepleri"
          action={requests.length > 0 ? 'Tümü →' : undefined}
          onAction={() => navigation.navigate('StoreManage', { tab: 'requests' })}
        />
        {loading ? (
          <View style={{ gap: space[2] }}>
            <SkeletonBox width="100%" height={56} />
            <SkeletonBox width="80%" height={56} />
          </View>
        ) : recentReqs.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="search-outline" size={26} color={colors.textMuted} />
            <Text style={s.emptyTxt}>Uygun müşteri talebi yok</Text>
          </View>
        ) : (
          <View style={s.card}>
            {recentReqs.map((req, i) => (
              <View key={req.id}>
                <ReqRow req={req} />
                {i < recentReqs.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const W_HALF = '47%';

const s = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: space[5],
    paddingBottom: space[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: space[3],
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  greeting:  { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textMuted },
  storeRow:  { flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap', marginTop: 2 },
  storeName: { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text },
  typeBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: 2, paddingHorizontal: space[2],
  },
  typeBadgeTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },
  notifBtn: {
    width: 42, height: 42, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1, borderColor: colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5, borderColor: colors.surface,
  },
  platformBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: space[2], paddingHorizontal: space[3],
    alignSelf: 'flex-start',
  },
  platformBtnTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },

  // Sections
  section: {
    paddingHorizontal: space[5],
    paddingTop: space[5],
  },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  statCard: {
    width: W_HALF,
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4], gap: space[2],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  statVal:      { fontFamily: fonts.displayBold, fontSize: fontSize.xl, color: colors.text },
  statLbl:      { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: space[3] },
  quickCard: {
    flex: 1, alignItems: 'center', gap: space[2],
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  quickIconWrap: { width: 42, height: 42, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  quickLabel:    { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },

  // Card + rows
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl2, borderWidth: 1, borderColor: colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: space[4] },

  // Appointment row
  apptRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    padding: space[4],
  },
  apptDot:      { width: 8, height: 8, borderRadius: 4 },
  apptTitle:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  apptMeta:     { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  apptBadge:    { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: space[2] },
  apptBadgeTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },

  // Request row
  reqRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    padding: space[4],
  },
  reqIconWrap: {
    width: 34, height: 34, borderRadius: radius.lg,
    backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center',
  },
  reqTitle:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  reqMeta:    { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  reqMetaTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  reqDate:    { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },

  // Empty
  emptyBox: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4],
  },
  emptyTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted },
});

const styles = { statCard: { width: W_HALF } };
