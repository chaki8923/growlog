import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };

  const ProfileItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    color?: string;
  }> = ({ icon, title, subtitle, onPress, showArrow = true, color = '#6366F1' }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.header}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.displayName || 'ユーザー'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント情報</Text>
          <ProfileItem
            icon="person"
            title="プロフィール編集"
            subtitle="名前やプロフィール画像を変更"
            onPress={() => {
              // TODO: プロフィール編集画面への遷移
              Alert.alert('準備中', 'この機能は現在開発中です');
            }}
          />
          <ProfileItem
            icon="mail"
            title="メールアドレス"
            subtitle={user?.email || ''}
            showArrow={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>
          <ProfileItem
            icon="notifications"
            title="通知設定"
            subtitle="プッシュ通知の設定"
            onPress={() => {
              Alert.alert('準備中', 'この機能は現在開発中です');
            }}
          />
          <ProfileItem
            icon="shield-checkmark"
            title="プライバシー"
            subtitle="データの取り扱いについて"
            onPress={() => {
              Alert.alert('準備中', 'この機能は現在開発中です');
            }}
          />
          <ProfileItem
            icon="help-circle"
            title="ヘルプ・サポート"
            subtitle="使い方やお問い合わせ"
            onPress={() => {
              Alert.alert('準備中', 'この機能は現在開発中です');
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <ProfileItem
            icon="document-text"
            title="利用規約"
            onPress={() => {
              Alert.alert('準備中', 'この機能は現在開発中です');
            }}
          />
          <ProfileItem
            icon="shield"
            title="プライバシーポリシー"
            onPress={() => {
              Alert.alert('準備中', 'この機能は現在開発中です');
            }}
          />
          <ProfileItem
            icon="log-out"
            title="ログアウト"
            onPress={handleLogout}
            showArrow={false}
            color="#EF4444"
          />
        </View>

        <View style={styles.version}>
          <Text style={styles.versionText}>バージョン 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  version: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
}); 