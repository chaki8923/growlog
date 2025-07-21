import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase.config';
import { Feather } from '@expo/vector-icons';
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

  // 気分評価の文字列変換
  const getMoodText = (mood: number) => {
    const moodTexts = ['', 'CRITICAL', 'ERROR', 'WARNING', 'SUCCESS', 'OPTIMAL'];
    return moodTexts[mood];
  };

  // 気分評価の色
  const getMoodColor = (mood: number) => {
    const moodColors = ['', '#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#0be881'];
    return moodColors[mood];
  };

  // 日付フォーマット
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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
            <ThemedText style={styles.loadingText}>[INFO] Loading growth records...</ThemedText>
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
          {/* ターミナルヘッダー */}
          <ThemedView style={styles.terminal}>
            <ThemedView style={styles.terminalHeader}>
              <ThemedView style={styles.terminalButtons}>
                <ThemedView style={[styles.terminalButton, styles.redButton]} />
                <ThemedView style={[styles.terminalButton, styles.yellowButton]} />
                <ThemedView style={[styles.terminalButton, styles.greenButton]} />
              </ThemedView>
              <ThemedText style={styles.terminalTitle}>growth-history v2.0.1</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.terminalContent}>
              <ThemedText style={styles.promptLine}>
                <ThemedText style={styles.prompt}>user@growlog:~$ </ThemedText>
                <ThemedText style={styles.command}>./list_records --format timeline</ThemedText>
              </ThemedText>
              <ThemedText style={styles.systemInfo}>
                [WARN] No growth records found in database
              </ThemedText>
              <ThemedText style={styles.systemInfo}>
                [INFO] Start recording your growth journey
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.emptyContent}>
            <Feather name="database" size={48} color="#58a6ff" style={styles.emptyIcon} />
            <ThemedText style={styles.emptyTitle}>DATABASE EMPTY</ThemedText>
            <ThemedText style={styles.emptyMessage}>
              No growth records detected.{'\n'}
              Navigate to growth-tracker module to begin data collection.
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
        {/* ターミナルヘッダー */}
        <ThemedView style={styles.terminal}>
          <ThemedView style={styles.terminalHeader}>
            <ThemedView style={styles.terminalButtons}>
              <ThemedView style={[styles.terminalButton, styles.redButton]} />
              <ThemedView style={[styles.terminalButton, styles.yellowButton]} />
              <ThemedView style={[styles.terminalButton, styles.greenButton]} />
            </ThemedView>
            <ThemedText style={styles.terminalTitle}>growth-history v2.0.1</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.terminalContent}>
            <ThemedText style={styles.promptLine}>
              <ThemedText style={styles.prompt}>user@growlog:~$ </ThemedText>
              <ThemedText style={styles.command}>./list_records --format timeline --limit 100</ThemedText>
            </ThemedText>
            <ThemedText style={styles.systemInfo}>
              [INFO] Found {reflections.length} growth records in database
            </ThemedText>
            <ThemedText style={styles.systemInfo}>
              [INFO] Displaying chronological timeline view
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {reflections.map((reflection) => (
          <TouchableOpacity
            key={reflection.id}
            style={styles.reflectionCard}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <ThemedView style={styles.cardInfo}>
                <Feather name="calendar" size={14} color="#58a6ff" />
                <ThemedText style={styles.cardDate}>
                  {formatDate(reflection.date)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.moodIndicator}>
                <Feather name="activity" size={12} color={getMoodColor(reflection.mood)} />
                <ThemedText style={[styles.cardMood, { color: getMoodColor(reflection.mood) }]}>
                  {getMoodText(reflection.mood)}
                </ThemedText>
              </ThemedView>
            </View>

            {/* 今日の出来事 */}
            {reflection.events && reflection.events.trim() && (
              <ThemedView style={styles.cardSection}>
                <ThemedView style={styles.sectionHeader}>
                  <Feather name="edit-3" size={12} color="#8b949e" />
                  <ThemedText style={styles.sectionTitle}>--events</ThemedText>
                </ThemedView>
                <ThemedText style={styles.sectionContent} numberOfLines={2}>
                  {reflection.events}
                </ThemedText>
              </ThemedView>
            )}

            {/* 考察・感情 */}
            {reflection.thoughts && reflection.thoughts.trim() && (
              <ThemedView style={styles.cardSection}>
                <ThemedView style={styles.sectionHeader}>
                  <Feather name="message-circle" size={12} color="#8b949e" />
                  <ThemedText style={styles.sectionTitle}>--thoughts</ThemedText>
                </ThemedView>
                <ThemedText style={styles.sectionContent} numberOfLines={2}>
                  {reflection.thoughts}
                </ThemedText>
              </ThemedView>
            )}

            {/* 成功体験・知識・スキル */}
            <ThemedView style={styles.cardSection}>
              <ThemedView style={styles.sectionHeader}>
                <Feather name="target" size={12} color="#0be881" />
                <ThemedText style={[styles.sectionTitle, styles.achievementTitle]}>--achievements</ThemedText>
              </ThemedView>
              <ThemedText style={styles.achievementContent} numberOfLines={3}>
                {reflection.achievements}
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        ))}

        {/* フッター */}
        <ThemedView style={styles.footer}>
          <Feather name="trending-up" size={16} color="#58a6ff" />
          <ThemedText style={styles.footerText}>
            GROWTH TRACKING ACTIVE - {reflections.length} RECORDS STORED
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
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
  terminal: {
    marginBottom: 16,
    backgroundColor: '#161b22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
    overflow: 'hidden',
  },
  terminalHeader: {
    backgroundColor: '#21262d',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  terminalButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  terminalButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  redButton: {
    backgroundColor: '#ff6b6b',
  },
  yellowButton: {
    backgroundColor: '#feca57',
  },
  greenButton: {
    backgroundColor: '#48dbfb',
  },
  terminalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
  },
  terminalContent: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  promptLine: {
    marginBottom: 8,
  },
  prompt: {
    color: '#0be881',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  command: {
    color: '#58a6ff',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  systemInfo: {
    color: '#7c3aed',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  emptyContent: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#58a6ff',
    fontFamily: 'monospace',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#8b949e',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  loadingText: {
    fontSize: 14,
    color: '#58a6ff',
    fontFamily: 'monospace',
  },
  reflectionCard: {
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    borderLeftWidth: 3,
    borderLeftColor: '#58a6ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#58a6ff',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cardMood: {
    fontSize: 11,
    marginLeft: 4,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  cardSection: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b949e',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  achievementTitle: {
    color: '#0be881',
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 18,
    color: '#f0f6fc',
    fontFamily: 'monospace',
    paddingLeft: 18,
  },
  achievementContent: {
    fontSize: 14,
    lineHeight: 18,
    color: '#0be881',
    fontFamily: 'monospace',
    fontWeight: '500',
    paddingLeft: 18,
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#161b22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#58a6ff',
    fontFamily: 'monospace',
    marginLeft: 8,
    fontWeight: 'bold',
  },
}); 