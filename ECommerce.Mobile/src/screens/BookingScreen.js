import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import axios from 'axios';
import { colors } from '../theme/colors';

const BookingScreen = ({ route, navigation }) => {
  const { storeId, packageId } = route.params || {};

  const [step, setStep]               = useState(1);
  const [profile, setProfile]         = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [date, setDate]               = useState('');  // YYYY-MM-DD
  const [time, setTime]               = useState('');  // HH:MM
  const [notes, setNotes]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [confirmed, setConfirmed]     = useState(null);

  useEffect(() => { fetchProfile(); }, [storeId]);

  useEffect(() => {
    if (packageId && profile?.servicePackages) {
      const pkg = profile.servicePackages.find(p => p.id === packageId);
      if (pkg) { setSelectedPkg(pkg); setStep(2); }
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/StoresApi/${storeId}/profile`);
      setProfile(res.data);
    } catch (e) {
      Alert.alert('Hata', 'Profil yüklenemedi.');
    }
  };

  const handleConfirm = async () => {
    if (!date || !time) { Alert.alert('Eksik bilgi', 'Tarih ve saat seçmelisin.'); return; }
    setSubmitting(true);
    try {
      const appointmentDate = new Date(`${date}T${time}`);
      const res = await axios.post('/api/AppointmentsApi', {
        storeId: parseInt(storeId),
        servicePackageId: selectedPkg?.id || null,
        appointmentDate: appointmentDate.toISOString(),
        notes: notes || null,
      });
      setConfirmed(res.data);
      setStep(4);
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Randevu oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Steps */}
      {step < 4 && (
        <View style={styles.steps}>
          {['Hizmet', 'Tarih', 'Onay'].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done   = step > n;
            return (
              <View key={n} style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepActive, done && styles.stepDone]}>
                  <Text style={[styles.stepNum, (active || done) && { color: 'white' }]}>{done ? '✓' : n}</Text>
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Adım 1: Hizmet */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.h2}>Hizmet seç</Text>
          <Text style={styles.sub}>{profile.name}</Text>

          {profile.servicePackages?.length === 0 && (
            <Text style={styles.empty}>Bu mağaza henüz hizmet eklemedi.</Text>
          )}

          {profile.servicePackages?.map(pkg => (
            <TouchableOpacity
              key={pkg.id}
              onPress={() => { setSelectedPkg(pkg); setStep(2); }}
              style={[styles.pkgCard, selectedPkg?.id === pkg.id && styles.pkgCardActive]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                <Text style={styles.pkgDesc} numberOfLines={2}>{pkg.description}</Text>
                <Text style={styles.pkgMeta}>{pkg.durationMinutes} dk</Text>
              </View>
              <Text style={styles.pkgPrice}>{pkg.price.toLocaleString('tr-TR')}₺</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Adım 2: Tarih + saat */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.h2}>Tarih ve saat</Text>
          <Text style={styles.sub}>{selectedPkg?.name} · {selectedPkg?.durationMinutes} dk</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Tarih (YYYY-AA-GG)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-05-15"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Saat (SS:DD)</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="14:30"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Not (opsiyonel)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Özel istek veya bilgi..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>← Geri</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStep(3)}
              style={[styles.btnPrimary, (!date || !time) && { opacity: 0.5 }]}
              disabled={!date || !time}
            >
              <Text style={styles.btnPrimaryText}>Devam</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Adım 3: Onay */}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.h2}>Onayla</Text>
          <Text style={styles.sub}>Bilgileri kontrol et.</Text>

          <View style={styles.summary}>
            <SummaryRow label="Mağaza"  value={profile.name} />
            <SummaryRow label="Hizmet"  value={selectedPkg?.name} />
            <SummaryRow label="Tarih"   value={new Date(`${date}T${time}`).toLocaleString('tr-TR')} />
            <SummaryRow label="Süre"    value={`${selectedPkg?.durationMinutes} dk`} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalValue}>{selectedPkg?.price.toLocaleString('tr-TR')}₺</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setStep(2)} style={styles.btnGhost} disabled={submitting}>
              <Text style={styles.btnGhostText}>← Geri</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.btnPrimary} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="white" />
                : <Text style={styles.btnPrimaryText}>Oluştur</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Adım 4: Onaylandı */}
      {step === 4 && confirmed && (
        <View style={[styles.card, { alignItems: 'center' }]}>
          <View style={styles.successCircle}><Text style={styles.successIcon}>✓</Text></View>
          <Text style={styles.h2}>Randevu oluşturuldu</Text>
          <Text style={styles.sub}>{profile.name} sana en kısa sürede dönecek.</Text>

          <View style={[styles.summary, { alignSelf: 'stretch', marginTop: 16 }]}>
            <SummaryRow label="Hizmet" value={selectedPkg?.name} />
            <SummaryRow label="Tarih"  value={new Date(confirmed.appointmentDate).toLocaleString('tr-TR')} />
            <SummaryRow label="Durum"  value={confirmed.status} />
          </View>

          <View style={[styles.actions, { alignSelf: 'stretch' }]}>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>Randevularım</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Discover')} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Keşfet</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const SummaryRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },

  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stepItem: { alignItems: 'center', flex: 1, gap: 6 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDone:   { backgroundColor: colors.success, borderColor: colors.success },
  stepNum:    { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  stepLabel:  { fontSize: 11, color: colors.textMuted },
  stepLabelActive: { color: colors.text, fontWeight: '700' },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: 16, padding: 20 },
  h2:   { fontSize: 20, fontWeight: '700', color: colors.text },
  sub:  { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },

  pkgCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5, borderColor: colors.borderSubtle,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  pkgCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pkgName:  { fontSize: 14, fontWeight: '700', color: colors.text },
  pkgDesc:  { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
  pkgMeta:  { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  pkgPrice: { fontSize: 15, fontWeight: '700', color: colors.text },

  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.text, fontSize: 14,
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnGhost: { flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 13, borderRadius: 8, alignItems: 'center' },
  btnGhostText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  btnPrimary: { flex: 2, backgroundColor: colors.primary, paddingVertical: 13, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: 'white', fontSize: 14, fontWeight: '700' },

  summary: { gap: 10 },
  row:     { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.accent },

  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successIcon:   { fontSize: 32, color: colors.success, fontWeight: '700' },

  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', padding: 20 },
});

export default BookingScreen;
