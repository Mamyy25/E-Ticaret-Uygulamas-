import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';

const FieldLabel = ({ children }) => (
  <Text style={styles.fieldLabel}>{children}</Text>
);

const FormInput = ({ label, ...props }) => (
  <View style={styles.field}>
    {label && <FieldLabel>{label}</FieldLabel>}
    <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />
  </View>
);

const SectionTitle = ({ icon, children }) => (
  <View style={styles.sectionTitleRow}>
    <Ionicons name={icon} size={16} color={colors.primary} />
    <Text style={styles.sectionTitle}>{children}</Text>
  </View>
);

const CheckoutScreen = ({ navigation, route }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const cartAmount = route.params?.totalAmount || 0;

  const [loading, setLoading] = useState(false);

  // Teslimat
  const [city, setCity]       = useState('');
  const [address, setAddress] = useState('');

  // Kart
  const [cardName, setCardName]     = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');

  const formatCard = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  };

  const formatExpiry = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const validate = () => {
    if (!city.trim() || !address.trim()) {
      Alert.alert('Eksik bilgi', 'Teslimat adresini doldurun.'); return false;
    }
    if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 16 || !expiry || cvv.length < 3) {
      Alert.alert('Eksik bilgi', 'Kart bilgilerini eksiksiz girin.'); return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/OrderApi', {
        shippingAddress: address,
        shippingCity: city,
      });
      Alert.alert(
        'Sipariş Tamamlandı',
        `Siparişiniz #${data.orderId || '—'} başarıyla oluşturuldu!`,
        [{ text: 'Siparişlerime Git', onPress: () => navigation.navigate('AnaSayfa') }],
      );
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || 'Sipariş oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* Tutar özeti */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Ödenecek Tutar</Text>
            <Text style={styles.amountValue}>₺{cartAmount.toLocaleString('tr-TR')}</Text>
            <Text style={styles.amountSub}>Dijital ürünler anında teslim edilir</Text>
          </View>

          {/* Teslimat */}
          <View style={styles.section}>
            <SectionTitle icon="location-outline">Teslimat Adresi</SectionTitle>
            <FormInput
              label="Şehir / İlçe"
              placeholder="Örn: Kadıköy, İstanbul"
              value={city}
              onChangeText={setCity}
            />
            <FormInput
              label="Açık Adres"
              placeholder="Mahalle, sokak, bina ve daire no"
              value={address}
              onChangeText={setAddress}
              multiline
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            />
          </View>

          {/* Kart Bilgileri */}
          <View style={styles.section}>
            <SectionTitle icon="card-outline">Kart Bilgileri</SectionTitle>

            <FormInput
              label="Kart Üzerindeki İsim"
              placeholder="Ad Soyad"
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="words"
            />

            <View style={styles.field}>
              <FieldLabel>Kart Numarası</FieldLabel>
              <View style={styles.cardNumWrap}>
                <TextInput
                  style={[styles.input, styles.cardNumInput]}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCard(t))}
                />
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.cardIcon}
                />
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <FieldLabel>Son Kullanma (AA/YY)</FieldLabel>
                <TextInput
                  style={styles.input}
                  placeholder="AA/YY"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={5}
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                />
              </View>
              <View style={{ width: space[3] }} />
              <View style={[styles.field, { flex: 1 }]}>
                <FieldLabel>CVV</FieldLabel>
                <TextInput
                  style={styles.input}
                  placeholder="•••"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={3}
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>
          </View>

          {/* Güvenlik notu */}
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
            <Text style={styles.securityText}>Bilgileriniz 256-bit SSL ile korunmaktadır</Text>
          </View>

          {/* Checkout butonu */}
          <TouchableOpacity
            style={[styles.checkoutBtn, loading && { opacity: 0.7 }]}
            onPress={handleCheckout}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Ionicons name="lock-closed" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.checkoutBtnText}>Siparişi Tamamla</Text>
                </>
              )
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: space[4], paddingBottom: 48 },

  amountCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: space[5],
    paddingHorizontal: space[6],
    alignItems: 'center',
    marginBottom: space[5],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  amountLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: space[2],
  },
  amountValue: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl3,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  amountSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space[5],
    marginBottom: space[4],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: space[4],
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.base,
    color: colors.text,
  },

  field:      { marginBottom: space[4] },
  fieldLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.text,
  },

  cardNumWrap: { position: 'relative' },
  cardNumInput: { paddingRight: 44 },
  cardIcon: { position: 'absolute', right: 14, top: 13 },

  rowFields: { flexDirection: 'row' },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: space[4],
  },
  securityText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.success,
  },

  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  checkoutBtnText: {
    fontFamily: fonts.displayBold,
    fontSize: fontSize.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
