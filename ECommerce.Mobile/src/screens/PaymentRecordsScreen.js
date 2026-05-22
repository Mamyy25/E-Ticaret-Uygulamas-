import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';

const METHODS  = ['Nakit', 'Havale/EFT', 'Kredi Kartı', 'Banka Kartı', 'Online'];
const EMPTY_F  = { amount: '', method: 0, direction: 0, description: '' };

function AddSheet({ visible, onClose, onSave }) {
  const sheetY    = React.useRef(new Animated.Value(450)).current;
  const bgOpacity = React.useRef(new Animated.Value(0)).current;
  const [form, setForm] = useState(EMPTY_F);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY, { toValue: 450, duration: 230, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
      setForm(EMPTY_F);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) { Alert.alert('Hata', 'Tutar girin.'); return; }
    setSaving(true);
    try {
      await axios.post('/api/PaymentRecordsApi', { ...form, amount: parseFloat(form.amount), method: parseInt(form.method), direction: parseInt(form.direction) });
      onSave(); onClose();
    } catch { Alert.alert('Hata', 'Kaydedilemedi.'); }
    finally { setSaving(false); }
  };

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Animated.View style={[sh.sheet, { transform: [{ translateY: sheetY }] }]}>
          <View style={sh.handle} />
          <View style={sh.header}><Text style={sh.title}>Ödeme Ekle</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={colors.textMuted} /></TouchableOpacity></View>

          {/* Yön seçici */}
          <View style={[sh.fieldWrap]}>
            <Text style={sh.label}>Tür</Text>
            <View style={{ flexDirection: 'row', gap: space[3] }}>
              {[{ val: 0, label: 'Gelen', color: colors.success, bg: colors.successSoft },
                { val: 1, label: 'Giden', color: colors.danger,  bg: colors.dangerSoft }].map(d => (
                <TouchableOpacity key={d.val} style={[sh.dirBtn, form.direction === d.val && { backgroundColor: d.bg, borderColor: d.color }]} onPress={() => setForm(p => ({ ...p, direction: d.val }))}>
                  <Ionicons name={d.val === 0 ? 'arrow-down-outline' : 'arrow-up-outline'} size={16} color={form.direction === d.val ? d.color : colors.textMuted} />
                  <Text style={[sh.dirTxt, form.direction === d.val && { color: d.color, fontFamily: fonts.bodySemiBold }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <View style={[sh.fieldWrap, { flex: 1 }]}>
              <Text style={sh.label}>Tutar (₺) *</Text>
              <TextInput style={sh.input} placeholder="500" keyboardType="numeric" placeholderTextColor={colors.textMuted} value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} />
            </View>
            <View style={[sh.fieldWrap, { flex: 1 }]}>
              <Text style={sh.label}>Yöntem</Text>
              <View style={[sh.input, { justifyContent: 'center' }]}>
                <TouchableOpacity onPress={() => setForm(p => ({ ...p, method: (p.method + 1) % METHODS.length }))}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.text }}>{METHODS[form.method]}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={sh.fieldWrap}>
            <Text style={sh.label}>Açıklama</Text>
            <TextInput style={sh.input} placeholder="Ödeme açıklaması..." placeholderTextColor={colors.textMuted} value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} />
          </View>

          <TouchableOpacity style={[sh.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={sh.saveTxt}>Kaydet</Text></>}
          </TouchableOpacity>
          <View style={{ height: space[4] }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function PaymentRecordsScreen() {
  const [items,      setItems]      = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await axios.get('/api/PaymentRecordsApi');
      const data = res.data;
      if (data?.items) { setItems(data.items); setSummary(data.summary); }
      else if (Array.isArray(data)) {
        setItems(data);
        const inc = data.filter(x => x.direction === 0 || x.direction === 'Incoming').reduce((s, x) => s + (x.amount ?? 0), 0);
        const out = data.filter(x => x.direction === 1 || x.direction === 'Outgoing').reduce((s, x) => s + (x.amount ?? 0), 0);
        setSummary({ totalIncoming: inc, totalOutgoing: out, net: inc - out });
      }
    } catch { setItems([]); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); fetch().finally(() => setLoading(false)); }, []));
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Özet bar */}
      {summary && (
        <View style={s.summaryBar}>
          {[
            { label: 'Gelen', val: summary.totalIncoming, color: colors.success },
            { label: 'Giden', val: summary.totalOutgoing, color: colors.danger },
            { label: 'Net',   val: summary.net,           color: colors.primary },
          ].map(item => (
            <View key={item.label} style={s.summaryItem}>
              <Text style={[s.summaryVal, { color: item.color }]}>₺{(item.val ?? 0).toLocaleString('tr-TR')}</Text>
              <Text style={s.summaryLbl}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {loading ? (
        <View style={{ padding: space[5], gap: space[3] }}>
          {[1,2,3].map(i => <SkeletonBox key={i} width="100%" height={60} />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="card-outline" title="Ödeme kaydı yok" description="Gelir ve giderlerinizi buraya ekleyin." action="Ödeme Ekle" onAction={() => setShowAdd(true)} />}
          renderItem={({ item }) => {
            const isIn = item.direction === 0 || item.direction === 'Incoming';
            return (
              <View style={s.card}>
                <View style={[s.dirIcon, { backgroundColor: isIn ? colors.successSoft : colors.dangerSoft }]}>
                  <Ionicons name={isIn ? 'arrow-down-outline' : 'arrow-up-outline'} size={18} color={isIn ? colors.success : colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.desc} numberOfLines={1}>{item.description || item.customerName || '—'}</Text>
                  <Text style={s.method}>{METHODS[item.method] ?? 'Nakit'}</Text>
                </View>
                <Text style={[s.amount, { color: isIn ? colors.success : colors.danger }]}>
                  {isIn ? '+' : '-'}₺{(item.amount ?? 0).toLocaleString('tr-TR')}
                </Text>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      <AddSheet visible={showAdd} onClose={() => setShowAdd(false)} onSave={fetch} />
    </View>
  );
}

const s = StyleSheet.create({
  summaryBar:    { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, paddingVertical: space[3] },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryVal:    { fontFamily: fonts.displayBold, fontSize: fontSize.md },
  summaryLbl:    { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  card:          { flexDirection: 'row', alignItems: 'center', gap: space[3], backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, padding: space[4] },
  dirIcon:       { width: 40, height: 40, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  desc:          { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  method:        { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  amount:        { fontFamily: fonts.displayBold, fontSize: fontSize.md },
  fab:           { position: 'absolute', bottom: space[6], right: space[5], width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8 },
});

const sh = StyleSheet.create({
  sheet:    { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2, padding: space[5], paddingTop: space[3], borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 16 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[4] },
  title:    { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  fieldWrap:{ marginBottom: space[4] },
  label:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: space[2] },
  input:    { backgroundColor: colors.surfaceRaised, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, paddingVertical: space[3], paddingHorizontal: space[4], fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text },
  dirBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: space[3] },
  dirTxt:   { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted },
  saveBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: space[4] },
  saveTxt:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
});
