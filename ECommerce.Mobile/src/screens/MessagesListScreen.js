import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import { AuthContext } from '../context/AuthContext';

const DARK = {
  bg:      '#080613',
  surface: '#110E1E',
  border:  'rgba(167,139,250,0.13)',
  text:    '#EAE8F4',
  sub:     '#A89FC4',
  muted:   '#6B6385',
};

const AVATAR_COLORS = [
  ['#4648D4', '#6063EE'],
  ['#7C3AED', '#A78BFA'],
  ['#0369A1', '#38BDF8'],
  ['#15803D', '#4ADE80'],
  ['#B45309', '#FCD34D'],
];

const getAvatarColors = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] || AVATAR_COLORS[0];
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return d.toLocaleDateString('tr-TR', { weekday: 'short' });
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

const ChatRow = ({ item, onPress, dark }) => {
  const D = dark ? DARK : null;
  const [bg1, bg2] = getAvatarColors(item.userName);
  const initials = (item.userName || '?').charAt(0).toUpperCase();
  const hasUnread = item.unreadCount > 0;

  return (
    <TouchableOpacity style={[styles.row, D && { backgroundColor: D.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: bg1 }]}>
        <Text style={styles.avatarText}>{initials}</Text>
        <View style={[styles.avatarAccent, { backgroundColor: bg2 }]} />
      </View>

      {/* Body */}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, hasUnread && styles.nameUnread, D && { color: D.text }]} numberOfLines={1}>
            {item.userName || 'Bilinmeyen Kullanıcı'}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread, D && !hasUnread && { color: D.muted }]}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread, D && !hasUnread && { color: D.muted }]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Henüz mesaj yok'}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MessagesListScreen = ({ navigation }) => {
  const { isAdmin } = useContext(AuthContext);
  const D = isAdmin ? DARK : null;

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get('/api/MessagesApi/list');
      setChats(data || []);
    } catch {
      // sessiz hata
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchChats(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchChats(true); };

  if (loading) {
    return (
      <View style={[styles.center, D && { backgroundColor: D.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, D && { backgroundColor: D.bg }]}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.userId?.toString()}
        renderItem={({ item }) => (
          <ChatRow
            item={item}
            dark={isAdmin}
            onPress={() =>
              navigation.navigate('Chat', {
                targetUserId: item.userId,
                targetUserName: item.userName,
              })
            }
          />
        )}
        contentContainerStyle={chats.length === 0 ? styles.emptyContainer : styles.listContent}
        style={D && { backgroundColor: D.bg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, D && { backgroundColor: D.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, D && { color: D.text }]}>Henüz sohbet yok</Text>
            <Text style={[styles.emptySub, D && { color: D.muted }]}>
              Bir satıcı veya hizmet sağlayıcısına mesaj attığınızda{'\n'}sohbetler burada görünür.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default MessagesListScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  listContent: { paddingTop: 8, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: space[6] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
    paddingVertical: space[3] + 2,
    backgroundColor: colors.canvas,
  },
  separator: { height: 1, backgroundColor: colors.borderSubtle, marginLeft: 72 },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space[3],
    overflow: 'hidden',
  },
  avatarAccent: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: 0.5,
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },

  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  nameUnread: { fontFamily: fonts.bodyBold },
  time: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  timeUnread: { color: colors.primary, fontFamily: fonts.bodySemiBold },

  rowBottom: { flexDirection: 'row', alignItems: 'center' },
  preview: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  previewUnread: { color: colors.textSecondary, fontFamily: fonts.bodyMedium },

  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.xs,
    color: '#FFFFFF',
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space[4],
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: space[2],
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
