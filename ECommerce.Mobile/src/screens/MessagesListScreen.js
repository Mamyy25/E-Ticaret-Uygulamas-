import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';

const MessagesListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const { data } = await axios.get('/api/MessagesApi/list');
      setChats(data);
    } catch (err) {
      console.warn('Mesajlar çekilemedi', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatCard}
      onPress={() => navigation.navigate('Chat', { targetUserId: item.userId, targetUserName: item.userName })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.userName ? item.userName.charAt(0) : '?'}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.userName || 'Bilinmeyen Kullanıcı'}</Text>
          <Text style={styles.time}>
            {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.lastMsg, item.unreadCount > 0 && styles.lastMsgUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.userId?.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
            <Text style={styles.emptyTitle}>Mesajınız Yok</Text>
            <Text style={styles.emptySub}>Satıcılarla iletişime geçtiğinizde mesajlar burada görünür.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default MessagesListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarText: { color: colors.surface, fontSize: 20, fontWeight: '800' },
  info: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  lastMsg: { fontSize: 14, color: colors.textMuted, flex: 1, paddingRight: 10 },
  lastMsgUnread: { color: colors.text, fontWeight: '700' },
  badge: { backgroundColor: colors.accentDark, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.surface, fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});
