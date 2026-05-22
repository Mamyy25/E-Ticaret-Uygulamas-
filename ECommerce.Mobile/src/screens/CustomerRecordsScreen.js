import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Alert,
  Animated, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';
import EmptyState from '../components/EmptyState';

const EMPTY = { fullName: '', email: '', phone: '', city: '', notes: '' };

function AddSheet({ visible, onClose, onSave }) {
  const sheetY    = React.useRef(new Animated.Value(500)).current;
  const bgOpacity = React.useRef(new Animated.Value(0)).current;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 500, duration: 230, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
      setForm(EMPTY);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!form.fullName.trim()) { Alert.alert('Hata', 'Ad Soyad zorunlu.'); return; }
    setSaving(true);
    try {
      await axios.post('/api/CustomerRecordsApi', form);
      onSave(); onClose();
    } catch { Alert.alert('Hata', 'Kaydedilemedi.'); }
    finally { setSaving(false); }
  };

  if (!visible) return null;
  const f = key => ({ value: form[key], onChangeText: v => setForm(p => ({ ...p, [key]: v })) });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Animated.View style={[sh.sheet, { transform: [{ translateY: sheetY }] }]}>
          <View style={sh.handle} />
          <View style={sh.header}>
            <Text style={sh.title}>Müşteri Ekle</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <View style={[sh.fieldWrap, { flex: 1 }]}>
              <Text style={sh.label}>Ad Soyad *</Text>
              <TextInput style={sh.input} placeholder="Ahmet Yılmaz" placeholderTextColor={colors.textMuted} {...f('fullName')} />
            </View>
            <View style={[sh.fieldWrap, { flex: 1 }]}>
              <Text style={sh.label}>Telefon</Text>
              <TextInput style={sh.input} placeholder="05xx..." keyboardType="phone-pad" placeholderTextColor={colors.textMuted} {...f('phone')} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <View style={[sh.fieldWrap, { flex: 1 }]}>
              <Text style={sh.label}>E-posta</Text>
              <TextInput style={sh.input} placeholder="mail@..." keyboardType="email-address" placeholderTextColor={colors.textMuted} {...f('email')} />
            </View>
            <View style={[sh.fieldWrap, { flex: 1 }]}>
              <Text style={sh.label}>Şehir</Text>
              <TextInput style={sh.input} placeholder="İstanbul" placeholderTextColor={colors.textMuted} {...f('city')} />
            </View>
          </View>
          <View style={sh.fieldWrap}>
            <Text style={sh.label}>Notlar</Text>
            <TextInput style={[sh.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Müşteri hakkında notlar..." multiline placeholderTextColor={colors.textMuted} {...f('notes')} />
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

export default function CustomerRecordsScreen() {
  const [customers,  setCustomers]  = useState([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  const fetch = useCallback(async (q = '') => {
    try {
      const res = await axios.get(`/api/CustomerRecordsApi${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch { setCustomers([]); }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetch().finally(() => setLoading(false));
  }, []));

  const onRefresh = async () => { setRefreshing(true); await fetch(search); setRefreshing(false); };

  const initials = (name) => (name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={17} color={colors.textMuted} style={{ marginLeft: space[3] }} />
        <TextInput style={s.searchInput} placeholder="Ad, telefon veya e-posta..." placeholderTextColor={colors.textMuted}
          value={search} onChangeText={v => { setSearch(v); fetch(v); }} />
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: space[5], gap: space[3] }}>
          {[1,2,3].map(i => <SkeletonBox key={i} width="100%" height={68} />)}
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="Müşteri kaydı yok" description="Müşterilerinizi ekleyerek takip edin." />}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.avatar}><Text style={s.avatarTxt}>{initials(item.fullName)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.fullName}</Text>
                <View style={s.metaRow}>
                  {item.phone && <Text style={s.meta}>{item.phone}</Text>}
                  {item.city && <Text style={s.meta}>{item.phone ? ' · ' : ''}{item.city}</Text>}
                </View>
                {item.notes ? <Text style={s.notes} numberOfLines={1}>{item.notes}</Text> : null}
              </View>
            </View>
          )}
        />
      )}
      <AddSheet visible={showAdd} onClose={() => setShowAdd(false)} onSave={() => fetch(search)} />
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: space[4], backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, gap: space[2],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  searchInput: { flex: 1, paddingVertical: space[3], paddingHorizontal: space[2], fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text },
  addBtn:      { width: 38, height: 38, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: space[1] },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, padding: space[4],
  },
  avatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: fonts.displayBold, fontSize: fontSize.base, color: colors.primary },
  name:      { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  metaRow:   { flexDirection: 'row', marginTop: 2 },
  meta:      { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  notes:     { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
});

const sh = StyleSheet.create({
  sheet:     { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2, padding: space[5], paddingTop: space[3], borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 16 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[4] },
  title:     { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  fieldWrap: { marginBottom: space[4] },
  label:     { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: space[2] },
  input:     { backgroundColor: colors.surfaceRaised, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, paddingVertical: space[3], paddingHorizontal: space[4], fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: space[4] },
  saveTxt:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
});
