import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const CheckoutScreen = ({ navigation, route }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Form States
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const cartAmount = route.params?.totalAmount || 0;

  const handleCheckout = async () => {
    if (!address.trim() || !city.trim() || !cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/OrderApi', { 
        shippingAddress: address,
        shippingCity: city,
        // Kart bilgileri güvenlik gereği backend'e bu basit formatta gidip gitmeyeceğine göre ayarlanır. Şimdilik simüle ediliyor.
      });
      
      Alert.alert(
        'Sipariş Başarılı 🎉', 
        `Siparişiniz #${data.orderId || Math.floor(Math.random() * 10000)} başarıyla oluşturuldu!`,
        [{ text: 'Tamam', onPress: () => navigation.navigate('AnaSayfa') }]
      );
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ödenecek Tutar</Text>
            <Text style={styles.summaryAmount}>₺{cartAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Teslimat Adresi</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şehir / İlçe</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Kadıköy, İstanbul"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Açık Adres</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Mahalle, sokak, bina ve daire numarası"
                placeholderTextColor={colors.textMuted}
                multiline
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Ödeme Bilgileri</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kart Üzerindeki İsim</Text>
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                placeholderTextColor={colors.textMuted}
                value={cardName}
                onChangeText={setCardName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kart Numarası</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={19}
                value={cardNumber}
                onChangeText={(text) => {
                  let cleaned = ('' + text).replace(/\D/g, '');
                  let match = cleaned.match(/.{1,4}/g);
                  setCardNumber(match ? match.join(' ') : cleaned);
                }}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>SKT (AA/YY)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AA/YY"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={5}
                  value={expiry}
                  onChangeText={(text) => {
                    let cleaned = ('' + text).replace(/\D/g, '');
                    if (cleaned.length >= 3) {
                      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
                    }
                    setExpiry(cleaned);
                  }}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
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

          <TouchableOpacity 
            style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]} 
            onPress={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.checkoutBtnText}>Siparişi Tamamla</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  summaryAmount: { fontSize: 32, fontWeight: '800', color: colors.surface },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  row: { flexDirection: 'row' },
  checkoutBtn: {
    backgroundColor: colors.accentDark,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  checkoutBtnDisabled: { opacity: 0.7 },
  checkoutBtnText: { color: colors.surface, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
