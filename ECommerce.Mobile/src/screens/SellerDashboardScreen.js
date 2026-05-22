import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import SectionHeader from '../components/SectionHeader';

const { width: W } = Dimensions.get('window');

// ─── Dönem hesaplama ──────────────────────────────────────────
const getPeriodRange = (key) => {
  const now = new Date();
  const to  = now.toISOString();
  let from;
  if (key === 'today') {
    const d = new Date(now); d.setHours(0, 0, 0, 0);
    from = d.toISOString();
  } else if (key === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0);
    from = d.toISOString();
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  return { from, to };
};

const PERIODS = [
  { key: 'today', label: 'Bugün' },
  { key: 'week',  label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
];

const ORDER_STATUS = {
  Pending:   { label: 'Bekliyor',   color: colors.warning, bg: colors.warningSoft },
  Completed: { label: 'Tamamlandı', color: colors.success, bg: colors.successSoft },
  Cancelled: { label: 'İptal',      color: colors.danger,  bg: colors.dangerSoft  },
};

const PAYMENT_METHOD = {
  0: 'Nakit', 1: 'Havale/EFT', 2: 'Kredi Kartı', 3: 'Banka Kartı', 4: 'Online',
};

// ─── Gelir kartı ─────────────────────────────────────────────
function RevenueCard({ label, amount, icon, color, bg }) {
  return (
    <View style={[s.revCard, { borderTopColor: color, borderTopWidth: 2 }]}>
      <View style={[s.revIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={s.revAmount}>
        ₺{(amount ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
      </Text>
      <Text style={s.revLabel}>{label}</Text>
    </View>
  );
}

// ─── Araç kartı (SaaS grid) ──────────────────────────────────
function ToolCard({ icon, label, count, color, bg, onPress }) {
  return (
    <TouchableOpacity style={s.toolCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.toolIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={s.toolLabel}>{label}</Text>
      {count != null && (
        <Text style={[s.toolCount, { color }]}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Ana ekran ────────────────────────────────────────────────
export default function SellerDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [period,        setPeriod]        = useState('month');
  const [revenue,       setRevenue]       = useState(null);
  const [orders,        setOrders]        = useState([]);
  const [payments,      setPayments]      = useState([]);
  const [customers,     setCustomers]     = useState([]);
  const [jobs,          setJobs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [revLoading,    setRevLoading]    = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

  const fetchBase = useCallback(async () => {
    try {
      const [ordRes, payRes, cusRes, jobRes] = await Promise.all([
        axios.get('/api/OrderApi/seller-orders').catch(() => ({ data: [] })),
        axios.get('/api/PaymentRecordsApi').catch(() => ({ data: {} })),
        axios.get('/api/CustomerRecordsApi').catch(() => ({ data: [] })),
        axios.get('/api/JobRecordsApi').catch(() => ({ data: [] })),
      ]);
      setOrders(Array.isArray(ordRes.data) ? ordRes.data.slice(0, 4) : []);
      // PaymentRecordsApi dönen yapı: { items, summary } veya doğrudan liste
      const payData = payRes.data;
      const payItems = Array.isArray(payData) ? payData : (payData?.items ?? []);
      setPayments(payItems.slice(0, 4));
      setCustomers(Array.isArray(cusRes.data) ? cusRes.data : []);
      setJobs(Array.isArray(jobRes.data) ? jobRes.data : []);
    } catch (e) {
      console.error('Dashboard fetch:', e.message);
    }
  }, []);

  const fetchRevenue = useCallback(async (p) => {
    setRevLoading(true);
    try {
      const { from, to } = getPeriodRange(p);
      const res = await axios.get(`/api/PaymentRecordsApi?from=${from}&to=${to}`);
      const data = res.data;
      // Dönen yapıya göre özeti çıkar
      if (data?.summary) {
        setRevenue(data.summary);
      } else if (Array.isArray(data)) {
        const items = data;
        const incoming = items.filter(x => x.direction === 0 || x.direction === 'Incoming').reduce((s, x) => s + (x.amount ?? 0), 0);
        const outgoing = items.filter(x => x.direction === 1 || x.direction === 'Outgoing').reduce((s, x) => s + (x.amount ?? 0), 0);
        setRevenue({ totalIncoming: incoming, totalOutgoing: outgoing, net: incoming - outgoing });
      }
    } catch {
      setRevenue({ totalIncoming: 0, totalOutgoing: 0, net: 0 });
    } finally {
      setRevLoading(false);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    fadeAnim.setValue(0);
    await Promise.all([fetchBase(), fetchRevenue(period)]);
    setLoading(false);
    fadeIn();
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBase(), fetchRevenue(period)]);
    setRefreshing(false);
  };

  const handlePeriod = (key) => {
    setPeriod(key);
    fetchRevenue(key);
  };

  // SaaS araç tanımları
  const TOOLS = [
    { icon: 'people-outline',              label: 'Müşteri\nDefteri',   count: customers.length,                                                   color: '#1D4ED8', bg: 'rgba(29,78,216,0.1)',  onPress: () => navigation.navigate('CustomerRecords') },
    { icon: 'checkmark-done-circle-outline',label: 'İş\nKayıtları',    count: jobs.filter(j => j.status === 1 || j.status === 'InProgress').length, color: '#15803D', bg: colors.successSoft,     onPress: () => navigation.navigate('JobRecords') },
    { icon: 'card-outline',                label: 'Ödeme\nTakibi',     count: payments.length,                                                    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  onPress: () => navigation.navigate('PaymentRecords') },
    { icon: 'receipt-outline',             label: 'Siparişler',        count: orders.length,                                                      color: colors.primary, bg: colors.primarySoft,  onPress: () => navigation.navigate('Siparisler') },
    { icon: 'calendar-outline',            label: 'Randevular',        count: null,                                                               color: colors.warning, bg: colors.warningSoft,  onPress: () => navigation.navigate('StoreManage') },
    { icon: 'document-text-outline',       label: 'Faturalar',         count: null,                                                               color: colors.info,    bg: colors.infoSoft,     onPress: () => navigation.navigate('Invoices') },
  ];

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['rgba(70,72,212,0.10)', 'rgba(70,72,212,0.03)', 'transparent']}
        style={[s.header, { paddingTop: insets.top + space[4] }]}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>İş Paneli</Text>
            <Text style={s.headerDate}>{today}</Text>
          </View>
          <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Dönem seçici */}
        <View style={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[s.periodBtn, period === p.key && s.periodBtnActive]}
              onPress={() => handlePeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.periodTxt, period === p.key && s.periodTxtActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: space[12] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Animated.View style={{ opacity: loading ? 1 : fadeAnim }}>

          {/* ── Gelir Kartları ── */}
          <View style={s.section}>
            {loading || revLoading ? (
              <View style={s.revRow}>
                {[1, 2, 3].map(i => <SkeletonBox key={i} width={(W - space[5] * 2 - space[3] * 2) / 3} height={90} />)}
              </View>
            ) : (
              <View style={s.revRow}>
                <RevenueCard label="Gelen"   amount={revenue?.totalIncoming} icon="arrow-down-circle-outline"  color={colors.success} bg={colors.successSoft} />
                <RevenueCard label="Giden"   amount={revenue?.totalOutgoing} icon="arrow-up-circle-outline"    color={colors.danger}  bg={colors.dangerSoft} />
                <RevenueCard label="Net"     amount={revenue?.net}           icon="stats-chart-outline"         color={colors.primary} bg={colors.primarySoft} />
              </View>
            )}
          </View>

          {/* ── SaaS Araçlar ── */}
          <View style={s.section}>
            <SectionHeader title="İş Araçları" />
            {loading ? (
              <View style={s.toolGrid}>
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonBox key={i} width={(W - space[5] * 2 - space[3]) / 2} height={88} />)}
              </View>
            ) : (
              <View style={s.toolGrid}>
                {TOOLS.map(tool => <ToolCard key={tool.label} {...tool} />)}
              </View>
            )}
          </View>

          {/* ── Son Siparişler ── */}
          <View style={s.section}>
            <SectionHeader
              title="Son Siparişler"
              action={orders.length > 0 ? 'Tümü →' : undefined}
              onAction={() => navigation.navigate('Siparisler')}
            />
            {loading ? (
              <View style={{ gap: space[2] }}>
                <SkeletonBox width="100%" height={60} />
                <SkeletonBox width="100%" height={60} />
              </View>
            ) : orders.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="receipt-outline" size={24} color={colors.textMuted} />
                <Text style={s.emptyTxt}>Henüz sipariş yok</Text>
              </View>
            ) : (
              <View style={s.listCard}>
                {orders.map((order, i) => {
                  const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.Pending;
                  return (
                    <View key={order.orderItemId ?? i}>
                      <View style={s.listRow}>
                        <View style={[s.listDot, { backgroundColor: st.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.listTitle} numberOfLines={1}>{order.productName}</Text>
                          <Text style={s.listSub}>{order.buyerName} · ₺{order.subTotal?.toLocaleString('tr-TR')}</Text>
                        </View>
                        <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                          <Text style={[s.statusPillTxt, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                      {i < orders.length - 1 && <View style={s.rowDivider} />}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Son Ödemeler ── */}
          <View style={s.section}>
            <SectionHeader
              title="Son Ödemeler"
              action={payments.length > 0 ? 'Tümü →' : undefined}
              onAction={() => navigation.navigate('PaymentRecords')}
            />
            {loading ? (
              <View style={{ gap: space[2] }}>
                <SkeletonBox width="100%" height={56} />
                <SkeletonBox width="100%" height={56} />
              </View>
            ) : payments.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="card-outline" size={24} color={colors.textMuted} />
                <Text style={s.emptyTxt}>Henüz ödeme kaydı yok</Text>
              </View>
            ) : (
              <View style={s.listCard}>
                {payments.map((pay, i) => {
                  const isIncoming = pay.direction === 0 || pay.direction === 'Incoming';
                  return (
                    <View key={pay.id ?? i}>
                      <View style={s.listRow}>
                        <View style={[s.listDot, { backgroundColor: isIncoming ? colors.success : colors.danger }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.listTitle} numberOfLines={1}>{pay.description || pay.customerName || '—'}</Text>
                          <Text style={s.listSub}>{PAYMENT_METHOD[pay.method] ?? 'Nakit'}</Text>
                        </View>
                        <Text style={[s.payAmount, { color: isIncoming ? colors.success : colors.danger }]}>
                          {isIncoming ? '+' : '-'}₺{(pay.amount ?? 0).toLocaleString('tr-TR')}
                        </Text>
                      </View>
                      {i < payments.length - 1 && <View style={s.rowDivider} />}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── İş Durumu ── */}
          {jobs.length > 0 && (
            <View style={s.section}>
              <SectionHeader
                title="Aktif İşler"
                action="Tümü →"
                onAction={() => navigation.navigate('JobRecords')}
              />
              <View style={s.listCard}>
                {jobs.filter(j => j.status === 1 || j.status === 'InProgress').slice(0, 3).map((job, i, arr) => (
                  <View key={job.id ?? i}>
                    <View style={s.listRow}>
                      <View style={[s.listDot, { backgroundColor: colors.info }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.listTitle} numberOfLines={1}>{job.title}</Text>
                        <Text style={s.listSub}>{job.customerName ?? '—'}</Text>
                      </View>
                      {job.amount ? (
                        <Text style={[s.payAmount, { color: colors.info }]}>₺{job.amount.toLocaleString('tr-TR')}</Text>
                      ) : null}
                    </View>
                    {i < arr.length - 1 && <View style={s.rowDivider} />}
                  </View>
                ))}
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const TOOL_W = (W - space[5] * 2 - space[3]) / 2;

const s = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: space[5],
    paddingBottom: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: space[3],
  },
  headerRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle:{ fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text },
  headerDate: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: radius.xl,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  // Dönem
  periodRow: { flexDirection: 'row', gap: space[2] },
  periodBtn: {
    paddingVertical: space[2], paddingHorizontal: space[4],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  periodBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  periodTxt:       { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  periodTxtActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },

  section: { paddingHorizontal: space[5], paddingTop: space[5] },

  // Gelir kartları
  revRow:    { flexDirection: 'row', gap: space[3] },
  revCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[3], gap: space[2], alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  revIconWrap: { width: 32, height: 32, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  revAmount:   { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text, textAlign: 'center' },
  revLabel:    { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },

  // Araç grid
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  toolCard: {
    width: TOOL_W,
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4], gap: space[2],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  toolIconWrap: { width: 40, height: 40, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  toolLabel:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.35 },
  toolCount:    { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs },

  // Liste kartı
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl2, borderWidth: 1, borderColor: colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  listRow:    { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4] },
  listDot:    { width: 8, height: 8, borderRadius: 4 },
  listTitle:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  listSub:    { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: space[4] },

  statusPill:    { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: space[2] },
  statusPillTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },
  payAmount:     { fontFamily: fonts.displayBold, fontSize: fontSize.sm },

  emptyBox: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, padding: space[4],
  },
  emptyTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted },
});
