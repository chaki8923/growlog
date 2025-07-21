import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase.config';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 振り返りデータの型定義
interface ReflectionData {
  id: string;
  date: Timestamp;
  events: string;
  thoughts: string;
  achievements: string;
  mood: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<ReflectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 気分評価の絵文字変換
  const getMoodEmoji = (mood: number) => {
    const moodEmojis = ['', '😞', '😕', '😐', '😊', '😄'];
    return moodEmojis[mood];
  };

  // 日付フォーマット
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // Firestoreから履歴を取得
  const fetchReflections = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'users', user.uid, 'dailyReflections'),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reflectionsData: ReflectionData[] = [];
      
      querySnapshot.forEach((doc) => {
        reflectionsData.push({
          id: doc.id,
          ...doc.data()
        } as ReflectionData);
      });
      console.log("reflectionsData",reflectionsData);
      
      setReflections(reflectionsData);
    } catch (error) {
      console.error('履歴取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // プルして更新
  const onRefresh = () => {
    setRefreshing(true);
    fetchReflections();
  };

  // 初回読み込み
  useEffect(() => {
    fetchReflections();
  }, [user]);

  // ローディング表示
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.centerContainer}>
            <ThemedText style={styles.loadingText}>成長記録を読み込んでいます...</ThemedText>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // データがない場合
  if (reflections.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ThemedView style={styles.emptyContent}>
            <ThemedText style={styles.emptyIcon}>🌱</ThemedText>
            <ThemedText style={styles.emptyTitle}>まだ成長記録がありません</ThemedText>
            <ThemedText style={styles.emptyMessage}>
              「成長記録」タブから今日の成長を記録してみましょう！
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>成長の軌跡</ThemedText>
          <ThemedText style={styles.subtitle}>
            これまでの記録: {reflections.length}日間 🌟
          </ThemedText>
        </ThemedView>

        {reflections.map((reflection) => (
          <TouchableOpacity
            key={reflection.id}
            style={styles.reflectionCard}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardDate}>
                {formatDate(reflection.date)}
              </ThemedText>
              <ThemedText style={styles.cardMood}>
                {getMoodEmoji(reflection.mood)}
              </ThemedText>
            </View>

            {/* 今日の出来事 */}
            {reflection.events.trim() && (
              <ThemedView style={styles.cardSection}>
                <ThemedText style={styles.sectionTitle}>📝 出来事</ThemedText>
                <ThemedText style={styles.sectionContent} numberOfLines={2}>
                  {reflection.events}
                </ThemedText>
              </ThemedView>
            )}

            {/* 考察・感情 */}
            {reflection.thoughts && (
              <ThemedView style={styles.cardSection}>
                <ThemedText style={styles.sectionTitle}>💭 考察・感情</ThemedText>
                <ThemedText style={styles.sectionContent} numberOfLines={2}>
                  {reflection.thoughts}
                </ThemedText>
              </ThemedView>
            )}

            {/* 成功体験・知識・スキル */}
            <ThemedView style={styles.cardSection}>
              <ThemedText style={styles.sectionTitle}>✨ 成功・知識・スキル</ThemedText>
              <ThemedText style={styles.achievementContent} numberOfLines={3}>
                {reflection.achievements}
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        ))}

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            継続は力なり！毎日の小さな成長が大きな変化を生みます 🌱➡️🌳
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#4a9960',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#4a9960',
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#2d7d46',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a9960',
    opacity: 0.8,
  },
  reflectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4a9960',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d7d46',
  },
  cardMood: {
    fontSize: 24,
  },
  cardSection: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
  },
  achievementContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#2d7d46',
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(74, 153, 96, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4a9960',
    fontStyle: 'italic',
    lineHeight: 20,
  },
}); 