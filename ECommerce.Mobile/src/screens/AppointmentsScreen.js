import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import Divider from '../components/Divider';
import { API_BASE } from '../config';

const STATUS = {
  Pending:   { label: 'Beklemede',   variant: 'warning' },
  Approved:  { label: 'Onaylandı',   variant: 'success' },
  Completed: { label: 'Tamamlandı',  variant: 'primary' },
  Cancelled: { label: 'İptal',       variant: 'danger'  },
};

function ApptCard({ appt, onCancel }) {
  const st   = STATUS[appt.status] ?? { label: appt.status, variant: 'neutral' };
  const date = appt.appointmentDate
    ? new Date(appt.appointmentDate).toLocaleString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const canCancel = appt.status === 'Pending' || appt.status === 'Approved';

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.iconBox}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.storeName} numberOfLines={1}>{appt.storeName ?? '—'}</Text>
          {appt.packageName ? (
            <Text style={s.packageName} numberOfLines={1}>{appt.packageName}</Text>
          ) : null}
        </View>
        <Badge label={st.label} variant={st.variant} />
      </View>

      <Divider style={{ marginVertical: space[3] }} />

      <View style={s.metaRow}>
        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
        <Text style={s.metaTxt}>{date}</Text>
      </View>

      {appt.notes ? (
        <View style={[s.metaRow, { marginTop: space[1] }]}>
          <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
          <Text style={s.metaTxt} numberOfLines={2}>{appt.notes}</Text>
        </View>
      ) : null}

      {canCancel && (
        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() => onCancel(appt.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
          <Text style={s.cancelTxt}>İptal Et</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AppointmentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      axios.get(`${API_BASE}/api/AppointmentsApi/mine`)
        .then(r => setAppointments(r.data ?? []))
        .catch(() => setAppointments([]))
        .finally(() => setLoading(false));
    }, [])
  );

  const handleCancel = (id) => {
    Alert.alert('Randevuyu İptal Et', 'Bu randevuyu iptal etmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et', style: 'destructive',
        onPress: async () => {
          try {
            await axios.put(`${API_BASE}/api/AppointmentsApi/${id}/status`, { status: 'Cancelled' });
            setAppointments(prev =>
              prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a)
            );
          } catch (e) {
            Alert.alert('Hata', e.response?.data?.message || 'İptal edilemedi.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[s.root, { padding: space[5], gap: space[3] }]}>
        {[1, 2, 3].map(i => <SkeletonBox key={i} width="100%" height={110} />)}
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <FlatList
        data={appointments}
        keyExtractor={a => String(a.id)}
        contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Henüz randevu yok"
            description="Hizmet bulup randevu oluşturduğunda burada görünecek."
            action="Keşfet"
            onAction={() => navigation.navigate('Kesfet')}
          />
        }
        renderItem={({ item }) => (
          <ApptCard appt={item} onCancel={handleCancel} />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space[4],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  storeName:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  packageName: { fontFamily: fonts.body,         fontSize: fontSize.xs,   color: colors.textMuted },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  metaTxt: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, flex: 1 },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[3],
    alignSelf: 'flex-start',
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.25)',
    backgroundColor: colors.dangerSoft,
  },
  cancelTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.danger },
});
