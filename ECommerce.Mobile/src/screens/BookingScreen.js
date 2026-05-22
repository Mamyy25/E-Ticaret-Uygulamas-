import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';

const SummaryRow = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const BookingScreen = ({ route, navigation }) => {
  const { storeId, packageId } = route.params || {};

  const [step, setStep]             = useState(1);
  const [profile, setProfile]       = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [date, setDate]             = useState('');
  const [time, setTime]             = useState('');
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed]   = useState(null);

  useEffect(() => { fetchProfile(); }, [storeId]);

  useEffect(() => {
    if (packageId && profile?.servicePackages) {
      const pkg = profile.servicePackages.find((p) => p.id === packageId);
      if (pkg) { setSelectedPkg(pkg); setStep(2); }
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`/api/StoresApi/${storeId}/profile`);
      setProfile(data);
    } catch {
      Alert.alert('Hata', 'Profil yüklenemedi.');
    }
  };

  const handleConfirm = async () => {
    if (!date || !time) { Alert.alert('Eksik bilgi', 'Tarih ve saat girmelisin.'); return; }
    setSubmitting(true);
    try {
      const appointmentDate = new Date(`${date}T${time}`);
      const { data } = await axios.post('/api/AppointmentsApi', {
        storeId: parseInt(storeId),
        servicePackageId: selectedPkg?.id || null,
        appointmentDate: appointmentDate.toISOString(),
        notes: notes || null,
      });
      setConfirmed(data);
      setStep(4);
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Randevu oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Step indicator */}
      {step < 4 && (
        <View style={styles.steps}>
          {['Hizmet', 'Tarih', 'Onay'].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done   = step > n;
            return (
              <View key={n} style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepActive, done && styles.stepDone]}>
                  {done
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={[styles.stepNum, (active || done) && { color: '#fff' }]}>{n}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Adım 1: Hizmet seç ── */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.h2}>Hizmet seçin</Text>
          <Text style={styles.sub}>{profile.name}</Text>

          {!profile.servicePackages?.length && (
            <Text style={styles.empty}>Bu mağazada henüz hizmet paketi yok.</Text>
          )}

          {profile.servicePackages?.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.pkgCard, selectedPkg?.id === pkg.id && styles.pkgCardActive]}
              onPress={() => { setSelectedPkg(pkg); setStep(2); }}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                {pkg.description ? (
                  <Text style={styles.pkgDesc} numberOfLines={2}>{pkg.description}</Text>
                ) : null}
                <Text style={styles.pkgMeta}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} /> {pkg.durationMinutes} dk
                </Text>
              </View>
              <Text style={styles.pkgPrice}>{pkg.price?.toLocaleString('tr-TR')}₺</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Adım 2: Tarih + saat ── */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.h2}>Tarih ve saat</Text>
          <Text style={styles.sub}>{selectedPkg?.name} · {selectedPkg?.durationMinutes} dk</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tarih</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-AA-GG  (örn: 2026-06-15)"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Saat</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="SS:DD  (örn: 14:30)"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Not (opsiyonel)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Özel istek veya not..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setStep(1)}>
              <Text style={styles.btnGhostText}>Geri</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, (!date || !time) && styles.btnDisabled]}
              onPress={() => setStep(3)}
              disabled={!date || !time}
            >
              <Text style={styles.btnPrimaryText}>Devam</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Adım 3: Onay ── */}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.h2}>Onayla</Text>
          <Text style={styles.sub}>Bilgileri kontrol edin.</Text>

          <View style={styles.summaryBox}>
            <SummaryRow label="Mağaza"   value={profile.name} />
            <SummaryRow label="Hizmet"   value={selectedPkg?.name} />
            <SummaryRow label="Tarih"    value={new Date(`${date}T${time}`).toLocaleString('tr-TR')} />
            <SummaryRow label="Süre"     value={`${selectedPkg?.durationMinutes} dk`} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalValue}>{selectedPkg?.price?.toLocaleString('tr-TR')}₺</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setStep(2)} disabled={submitting}>
              <Text style={styles.btnGhostText}>Geri</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleConfirm} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>Oluştur</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Adım 4: Onaylandı ── */}
      {step === 4 && confirmed && (
        <View style={[styles.card, { alignItems: 'center' }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success} />
          </View>
          <Text style={styles.h2}>Randevu oluşturuldu!</Text>
          <Text style={styles.sub}>{profile.name} en kısa sürede size dönecek.</Text>

          <View style={[styles.summaryBox, { alignSelf: 'stretch', marginTop: space[4] }]}>
            <SummaryRow label="Hizmet" value={selectedPkg?.name} />
            <SummaryRow label="Tarih"  value={new Date(confirmed.appointmentDate).toLocaleString('tr-TR')} />
            <SummaryRow label="Durum"  value={confirmed.status || 'Beklemede'} />
          </View>

          <View style={[styles.actions, { alignSelf: 'stretch', marginTop: space[4] }]}>
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => navigation.navigate('Profil', { screen: 'MyAppointments' })}
            >
              <Text style={styles.btnGhostText}>Randevularım</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate('Kesfet')}
            >
              <Text style={styles.btnPrimaryText}>Keşfet</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  scroll:    { padding: space[4], paddingBottom: 48 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },

  // Step bar
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space[5] },
  stepItem:  { alignItems: 'center', flex: 1, gap: 6 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1, borderColor: colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDone:   { backgroundColor: colors.success, borderColor: colors.success },
  stepNum:    { fontFamily: fonts.bodyBold, fontSize: fontSize.sm, color: colors.textMuted },
  stepLabel:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  stepLabelActive: { fontFamily: fonts.bodyBold, color: colors.text },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderSubtle,
    borderRadius: radius.xl, padding: space[5],
  },
  h2:  { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, marginBottom: space[5] },

  // Package cards
  pkgCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5, borderColor: colors.borderSubtle,
    borderRadius: radius.lg, padding: space[4], marginBottom: space[2] + 2,
  },
  pkgCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pkgName:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  pkgDesc:  { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  pkgMeta:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 5 },
  pkgPrice: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.primary },

  // Form
  field:      { marginBottom: space[4] },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: space[4], paddingVertical: space[3],
    fontFamily: fonts.body, fontSize: fontSize.base, color: colors.text,
  },

  // Summary
  summaryBox: { gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary },
  summaryValue: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: space[3], marginTop: space[1],
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: fontSize.base, color: colors.text },
  totalValue: { fontFamily: fonts.display, fontSize: fontSize.md, color: colors.primary },

  // Buttons
  actions:      { flexDirection: 'row', gap: 10, marginTop: space[4] },
  btnGhost: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 13, borderRadius: radius.md, alignItems: 'center',
  },
  btnGhostText: { fontFamily: fonts.bodyBold, fontSize: fontSize.sm, color: colors.textSecondary },
  btnPrimary: {
    flex: 2, backgroundColor: colors.primary,
    paddingVertical: 13, borderRadius: radius.md, alignItems: 'center',
  },
  btnPrimaryText: { fontFamily: fonts.bodyBold, fontSize: fontSize.sm, color: '#fff' },
  btnDisabled:    { opacity: 0.45 },

  // Success
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.successSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space[3],
  },

  empty: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', padding: space[5] },
});
