import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';

const STATUS_CONFIG = {
  0: { label: 'Bekliyor',      variant: 'neutral', color: colors.textMuted,  icon: 'hourglass-outline' },
  1: { label: 'Devam Ediyor',  variant: 'primary', color: colors.primary,    icon: 'play-circle-outline' },
  2: { label: 'Tamamlandı',    variant: 'success', color: colors.success,    icon: 'checkmark-circle-outline' },
  3: { label: 'İptal',         variant: 'danger',  color: colors.danger,     icon: 'close-circle-outline' },
};

const FILTERS = [
  { key: null, label: 'Tümü' },
  { key: 1,    label: 'Devam Eden' },
  { key: 0,    label: 'Bekleyen' },
  { key: 2,    label: 'Tamamlanan' },
];

const updateStatus = async (id, status, onDone) => {
  try {
    await axios.put(`/api/JobRecordsApi/${id}`, { status });
    onDone();
  } catch { Alert.alert('Hata', 'Durum güncellenemedi.'); }
};

export default function JobRecordsScreen() {
  const [jobs,       setJobs]       = useState([]);
  const [filter,     setFilter]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async (status = null) => {
    try {
      const url = status !== null ? `/api/JobRecordsApi?status=${status}` : '/api/JobRecordsApi';
      const res = await axios.get(url);
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch { setJobs([]); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); fetch(filter).finally(() => setLoading(false)); }, []));

  const onRefresh = async () => { setRefreshing(true); await fetch(filter); setRefreshing(false); };

  const handleFilter = (key) => {
    setFilter(key);
    setLoading(true);
    fetch(key).finally(() => setLoading(false));
  };

  // Toplam özet
  const total   = jobs.reduce((s, j) => s + (j.amount ?? 0), 0);
  const active  = jobs.filter(j => j.status === 1).length;
  const done    = jobs.filter(j => j.status === 2).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Özet bar */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}><Text style={[s.summaryVal, { color: colors.primary }]}>{jobs.length}</Text><Text style={s.summaryLbl}>Toplam</Text></View>
        <View style={s.summaryDiv} />
        <View style={s.summaryItem}><Text style={[s.summaryVal, { color: colors.info }]}>{active}</Text><Text style={s.summaryLbl}>Devam Eden</Text></View>
        <View style={s.summaryDiv} />
        <View style={s.summaryItem}><Text style={[s.summaryVal, { color: colors.success }]}>{done}</Text><Text style={s.summaryLbl}>Tamamlanan</Text></View>
        <View style={s.summaryDiv} />
        <View style={s.summaryItem}><Text style={[s.summaryVal, { color: colors.primary }]}>₺{total.toLocaleString('tr-TR')}</Text><Text style={s.summaryLbl}>Toplam Değer</Text></View>
      </View>

      {/* Filtreler */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterList}>
        {FILTERS.map(f => (
          <TouchableOpacity key={String(f.key)} style={[s.filterChip, filter === f.key && s.filterChipActive]} onPress={() => handleFilter(f.key)} activeOpacity={0.7}>
            <Text style={[s.filterTxt, filter === f.key && s.filterTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ padding: space[5], gap: space[3] }}>
          {[1,2,3].map(i => <SkeletonBox key={i} width="100%" height={80} />)}
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="checkmark-done-outline" title="İş kaydı yok" description="Müşteri işlerini buradan takip edin." />}
          renderItem={({ item }) => {
            const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG[0];
            const scheduledDate = item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : null;
            return (
              <View style={s.card}>
                <View style={s.cardTop}>
                  <View style={[s.statusIcon, { backgroundColor: `${st.color}18` }]}>
                    <Ionicons name={st.icon} size={18} color={st.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.jobTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={s.metaRow}>
                      {item.customerName && <Text style={s.meta}>{item.customerName}</Text>}
                      {scheduledDate && <Text style={s.meta}> · 📅 {scheduledDate}</Text>}
                      {item.amount > 0 && <Text style={[s.meta, { color: colors.primary, fontFamily: fonts.bodySemiBold }]}> · ₺{item.amount.toLocaleString('tr-TR')}</Text>}
                    </View>
                  </View>
                  <Badge label={st.label} variant={st.variant} size="sm" />
                </View>
                {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}

                {/* Durum güncelleme */}
                {(item.status === 0 || item.status === 1) && (
                  <View style={s.actionRow}>
                    {item.status === 0 && (
                      <TouchableOpacity style={[s.actionBtn, s.startBtn]} onPress={() => updateStatus(item.id, 1, () => fetch(filter))} activeOpacity={0.8}>
                        <Ionicons name="play-outline" size={13} color={colors.primary} />
                        <Text style={s.startTxt}>Başlat</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 1 && (
                      <TouchableOpacity style={[s.actionBtn, s.doneBtn]} onPress={() => updateStatus(item.id, 2, () => fetch(filter))} activeOpacity={0.8}>
                        <Ionicons name="checkmark-outline" size={13} color={colors.success} />
                        <Text style={s.doneTxt}>Tamamlandı</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  summaryBar:    { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, paddingVertical: space[3] },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryVal:    { fontFamily: fonts.displayBold, fontSize: fontSize.md },
  summaryLbl:    { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  summaryDiv:    { width: 1, backgroundColor: colors.borderSubtle },
  filterList:    { paddingHorizontal: space[4], paddingVertical: space[3], gap: space[2] },
  filterChip:    { paddingVertical: 7, paddingHorizontal: space[4], borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  filterTxt:     { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  filterTxtActive:  { fontFamily: fonts.bodySemiBold, color: colors.primary },
  card:          { backgroundColor: colors.surface, borderRadius: radius.xl2, borderWidth: 1, borderColor: colors.borderSubtle, padding: space[4], gap: space[2] },
  cardTop:       { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  statusIcon:    { width: 38, height: 38, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  jobTitle:      { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  meta:          { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  desc:          { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: fontSize.xs * 1.5, paddingLeft: space[3] + 38 },
  actionRow:     { flexDirection: 'row', gap: space[2], paddingLeft: space[3] + 38 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: space[3], borderWidth: 1 },
  startBtn:      { backgroundColor: colors.primarySoft, borderColor: colors.glassBorder },
  startTxt:      { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },
  doneBtn:       { backgroundColor: colors.successSoft, borderColor: colors.successBorder },
  doneTxt:       { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.success },
});
