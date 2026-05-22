import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ScrollView, Alert, TextInput,
  Animated, Pressable, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';

// ─── Sabitler ─────────────────────────────────────────────────
const STATUS = {
  0: { label: 'Taslak',   color: colors.textMuted,  bg: colors.surfaceRaised,   icon: 'document-outline' },
  1: { label: 'Gönderildi', color: colors.primary,  bg: colors.primarySoft,     icon: 'paper-plane-outline' },
  2: { label: 'Ödendi',   color: colors.success,    bg: colors.successSoft,     icon: 'checkmark-circle-outline' },
  3: { label: 'Gecikmiş', color: colors.danger,     bg: colors.dangerSoft,      icon: 'alert-circle-outline' },
  4: { label: 'İptal',    color: colors.textMuted,  bg: colors.surfaceRaised,   icon: 'close-circle-outline' },
};

const TYPE = { 0: 'Standart', 1: 'E-Fatura' };

const STATUS_FILTERS = [
  { key: null,  label: 'Tümü' },
  { key: 0,     label: 'Taslak' },
  { key: 1,     label: 'Gönderildi' },
  { key: 2,     label: 'Ödendi' },
  { key: 3,     label: 'Gecikmiş' },
];

const NEXT_STATUSES = {
  0: [{ value: 1, label: 'Gönderildi İşaretle' }],
  1: [{ value: 2, label: 'Ödendi İşaretle' }, { value: 3, label: 'Gecikmiş İşaretle' }, { value: 4, label: 'İptal Et' }],
  2: [],
  3: [{ value: 2, label: 'Ödendi İşaretle' }, { value: 4, label: 'İptal Et' }],
  4: [],
};

// ─── Sheet wrapper (aynı pattern) ────────────────────────────
function Sheet({ visible, onClose, title, children, footer }) {
  const sheetY    = useRef(new Animated.Value(700)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 700, duration: 230, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={s.sheetHandle} />
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space[4] }}>
            {children}
          </ScrollView>
          {footer}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

function Field({ label, hint, error, children, style }) {
  return (
    <View style={[{ marginBottom: space[4] }, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      {hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
      {children}
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ─── Yeni Fatura Sheet ────────────────────────────────────────
function CreateInvoiceSheet({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({
    receiverName: '', receiverTaxNumber: '', receiverAddress: '',
    subTotal: '', taxRate: '20', dueAt: '', type: 0,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (!visible) {
      setForm({ receiverName: '', receiverTaxNumber: '', receiverAddress: '', subTotal: '', taxRate: '20', dueAt: '', type: 0 });
      setErrors({});
    }
  }, [visible]);

  const validate = () => {
    const e = {};
    if (!form.receiverName.trim()) e.receiverName = 'Alıcı adı zorunlu';
    if (!form.subTotal || isNaN(parseFloat(form.subTotal))) e.subTotal = 'Geçerli bir tutar girin';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const taxRate = parseFloat(form.taxRate) || 20;
      await axios.post('/api/InvoicesApi', {
        subTotal:          parseFloat(form.subTotal),
        taxRate,
        type:              form.type,
        receiverName:      form.receiverName.trim(),
        receiverTaxNumber: form.receiverTaxNumber.trim() || null,
        receiverAddress:   form.receiverAddress.trim()   || null,
        dueAt:             form.dueAt ? new Date(form.dueAt).toISOString() : null,
      });
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Fatura oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({ value: form[key], onChangeText: v => setForm(p => ({ ...p, [key]: v })) });

  const taxAmount = parseFloat(form.subTotal || 0) * (parseFloat(form.taxRate || 0) / 100);
  const total     = parseFloat(form.subTotal || 0) + taxAmount;

  const footer = (
    <View style={s.footer}>
      {form.subTotal ? (
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Ara Toplam</Text>
          <Text style={s.totalVal}>₺{parseFloat(form.subTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
        </View>
      ) : null}
      {form.subTotal ? (
        <View style={[s.totalRow, { marginBottom: space[2] }]}>
          <Text style={s.totalLabel}>KDV (%{form.taxRate || 20})</Text>
          <Text style={s.totalVal}>₺{taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
        </View>
      ) : null}
      {form.subTotal ? (
        <View style={[s.totalRow, { marginBottom: space[3] }]}>
          <Text style={[s.totalLabel, { fontFamily: fonts.bodySemiBold, color: colors.text }]}>Genel Toplam</Text>
          <Text style={[s.totalVal, { color: colors.primary, fontFamily: fonts.displayBold }]}>₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
        </View>
      ) : null}
      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <>
          <Ionicons name="document-text-outline" size={17} color="#fff" />
          <Text style={s.saveBtnTxt}>Fatura Oluştur</Text>
        </>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Yeni Fatura" footer={footer}>
      {/* Tür seçimi */}
      <Field label="Fatura Türü">
        <View style={s.typeRow}>
          {[{ v: 0, label: 'Standart' }, { v: 1, label: 'E-Fatura' }].map(t => (
            <TouchableOpacity
              key={t.v}
              style={[s.typeBtn, form.type === t.v && s.typeBtnActive]}
              onPress={() => setForm(p => ({ ...p, type: t.v }))}
              activeOpacity={0.8}
            >
              <Ionicons name={t.v === 0 ? 'document-outline' : 'cloud-outline'} size={16} color={form.type === t.v ? '#fff' : colors.textSecondary} />
              <Text style={[s.typeBtnTxt, form.type === t.v && s.typeBtnTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Alıcı Adı / Unvanı *" error={errors.receiverName}>
        <TextInput style={[s.input, errors.receiverName && s.inputErr]} placeholder="Müşteri adı veya şirket unvanı" placeholderTextColor={colors.textMuted} {...f('receiverName')} />
      </Field>

      <Field label="Vergi Kimlik No" hint="Şirketler için">
        <TextInput style={s.input} placeholder="1234567890" placeholderTextColor={colors.textMuted} keyboardType="numeric" {...f('receiverTaxNumber')} />
      </Field>

      <Field label="Alıcı Adresi">
        <TextInput style={[s.input, s.textarea]} placeholder="Faturaya yazılacak adres..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} textAlignVertical="top" {...f('receiverAddress')} />
      </Field>

      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <Field label="Tutar (₺) *" error={errors.subTotal} style={{ flex: 1 }}>
          <TextInput style={[s.input, errors.subTotal && s.inputErr]} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" {...f('subTotal')} />
        </Field>
        <Field label="KDV (%)" style={{ flex: 1 }}>
          <TextInput style={s.input} placeholder="20" placeholderTextColor={colors.textMuted} keyboardType="numeric" {...f('taxRate')} />
        </Field>
      </View>

      <Field label="Vade Tarihi" hint="YYYY-AA-GG formatında">
        <TextInput style={s.input} placeholder="2026-06-01" placeholderTextColor={colors.textMuted} {...f('dueAt')} />
      </Field>
    </Sheet>
  );
}

// ─── Fatura Kartı ─────────────────────────────────────────────
function InvoiceCard({ item, onStatusChange }) {
  const sc = STATUS[item.status] ?? STATUS[0];
  const actions = NEXT_STATUSES[item.status] ?? [];

  const confirmStatusChange = (value, label) => {
    Alert.alert(`Durumu "${label}" Yap`, 'Bu işlemi onaylıyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Evet', onPress: () => onStatusChange(item.id, value) },
    ]);
  };

  return (
    <View style={s.card}>
      {/* Üst satır */}
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.invoiceNo}>{item.invoiceNumber}</Text>
          <Text style={s.receiverName}>{item.receiverName || item.customerName || '—'}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon} size={11} color={sc.color} />
          <Text style={[s.statusTxt, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      {/* Tutar + tür */}
      <View style={s.amountRow}>
        <Text style={s.amount}>₺{item.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
        <View style={s.typeChip}>
          <Text style={s.typeChipTxt}>{TYPE[item.type] ?? 'Standart'}</Text>
        </View>
      </View>

      {/* Tarihler */}
      <View style={s.datesRow}>
        <View style={s.dateChip}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={s.dateTxt}>{new Date(item.issuedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        {item.dueAt && (
          <View style={s.dateChip}>
            <Ionicons name="time-outline" size={11} color={item.status === 3 ? colors.danger : colors.textMuted} />
            <Text style={[s.dateTxt, item.status === 3 && { color: colors.danger }]}>
              Vade: {new Date(item.dueAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        )}
      </View>

      {/* Aksiyonlar */}
      {actions.length > 0 && (
        <View style={s.actionRow}>
          {actions.map(a => (
            <TouchableOpacity key={a.value} style={s.actionBtn} onPress={() => confirmStatusChange(a.value, a.label)} activeOpacity={0.8}>
              <Text style={s.actionBtnTxt}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────
export default function InvoicesScreen() {
  const [invoices,    setInvoices]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [activeFilter, setFilter]    = useState(null);
  const [sheetOpen,   setSheetOpen]  = useState(false);
  const [updating,    setUpdating]   = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const params = activeFilter !== null ? { status: activeFilter } : {};
      const res = await axios.get('/api/InvoicesApi', { params });
      setInvoices(res.data ?? []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useFocusEffect(useCallback(() => { fetchInvoices(); }, [fetchInvoices]));

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await axios.patch(`/api/InvoicesApi/${id}/status`, { status });
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    } catch {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    } finally {
      setUpdating(null);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.totalAmount ?? 0), 0);
  const paidAmount  = invoices.filter(i => i.status === 2).reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);

  return (
    <View style={s.root}>
      {/* Özet bar */}
      {!loading && invoices.length > 0 && (
        <View style={s.summaryBar}>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>{invoices.length}</Text>
            <Text style={s.summaryLbl}>Fatura</Text>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.primary }]}>₺{totalAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</Text>
            <Text style={s.summaryLbl}>Toplam</Text>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.success }]}>₺{paidAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</Text>
            <Text style={s.summaryLbl}>Tahsil</Text>
          </View>
        </View>
      )}

      {/* Filtre chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={String(f.key)}
            style={[s.filterChip, activeFilter === f.key && s.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterChipTxt, activeFilter === f.key && s.filterChipTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste */}
      {loading ? (
        <View style={{ padding: space[5], gap: space[3] }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[s.card, { gap: space[3] }]}>
              <SkeletonBox width="50%" height={16} />
              <SkeletonBox width="70%" height={22} />
              <SkeletonBox width="40%" height={14} />
            </View>
          ))}
        </View>
      ) : invoices.length === 0 ? (
        <View style={s.emptyWrap}>
          <EmptyState
            icon="document-text-outline"
            title="Henüz fatura yok"
            description="Müşterilerinize fatura kesmek için yeni fatura oluşturun."
          />
          <TouchableOpacity style={s.createBtn} onPress={() => setSheetOpen(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.createBtnTxt}>İlk Faturayı Oluştur</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: space[4], gap: space[3], paddingBottom: space[20] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            updating === item.id
              ? <View style={[s.card, { justifyContent: 'center', alignItems: 'center', minHeight: 80 }]}><ActivityIndicator color={colors.primary} /></View>
              : <InvoiceCard item={item} onStatusChange={handleStatusChange} />
          )}
        />
      )}

      {/* FAB */}
      {!loading && invoices.length > 0 && (
        <TouchableOpacity style={s.fab} onPress={() => setSheetOpen(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Sheet */}
      <CreateInvoiceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSuccess={() => { setSheetOpen(false); fetchInvoices(); }} />
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    paddingHorizontal: space[5], paddingVertical: space[3],
  },
  summaryItem:  { flex: 1, alignItems: 'center' },
  summaryDiv:   { width: 1, height: 28, backgroundColor: colors.borderSubtle },
  summaryVal:   { fontFamily: fonts.displayBold, fontSize: fontSize.base, color: colors.text },
  summaryLbl:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },

  filterRow: { paddingHorizontal: space[4], paddingVertical: space[3], gap: space[2] },
  filterChip: {
    paddingVertical: 7, paddingHorizontal: space[3],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive:   { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  filterChipTxt:      { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  filterChipTxtActive:{ fontFamily: fonts.bodySemiBold, color: colors.primary },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: space[2], marginBottom: space[2] },
  invoiceNo:    { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textMuted, letterSpacing: 0.5 },
  receiverName: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginTop: 2 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: space[2],
  },
  statusTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },

  amountRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[2] },
  amount:     { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  typeChip:   { backgroundColor: colors.surfaceRaised, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderSubtle, paddingVertical: 3, paddingHorizontal: space[2] },
  typeChipTxt:{ fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textMuted },

  datesRow: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap', marginBottom: space[2] },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceRaised, borderRadius: radius.pill,
    paddingVertical: 3, paddingHorizontal: space[2],
  },
  dateTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },

  actionRow: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap', marginTop: space[1] },
  actionBtn: {
    paddingVertical: space[2], paddingHorizontal: space[3],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: colors.primarySoft,
  },
  actionBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },

  emptyWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space[4], padding: space[6] },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[3], paddingHorizontal: space[5],
  },
  createBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },

  // Sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3], paddingBottom: space[5],
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[4] },
  sheetTitle:  { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },

  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: space[1] },
  fieldHint:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginBottom: space[2] },
  fieldError: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.danger, marginTop: space[1] },

  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[3], paddingHorizontal: space[4],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
  },
  textarea:  { height: 72, textAlignVertical: 'top' },
  inputErr:  { borderColor: colors.danger },

  typeRow:        { flexDirection: 'row', gap: space[3] },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    paddingVertical: space[3], backgroundColor: colors.surface,
  },
  typeBtnActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  typeBtnTxt:       { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.textSecondary },
  typeBtnTxtActive: { color: '#fff' },

  footer: {
    paddingTop: space[3],
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space[1] },
  totalLabel: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary },
  totalVal:   { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.text },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[4], marginTop: space[2],
  },
  saveBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
});
