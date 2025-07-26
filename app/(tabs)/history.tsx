import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase.config';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  
  // 編集モード関連の状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ReflectionData>>({});
  const [saving, setSaving] = useState(false);

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

  // 編集モードを開始
  const startEdit = (reflection: ReflectionData) => {
    setEditingId(reflection.id);
    setEditData({
      events: reflection.events,
      thoughts: reflection.thoughts,
      achievements: reflection.achievements,
      mood: reflection.mood,
    });
  };

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // 編集を保存
  const saveEdit = async () => {
    if (!user || !editingId) return;

    // バリデーション（achievementsは必須）
    if (!editData.achievements?.trim()) {
      Alert.alert('入力エラー', '成功体験・学んだことの入力は必須です');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'dailyReflections', editingId);
      await updateDoc(docRef, {
        events: editData.events?.trim() || '',
        thoughts: editData.thoughts?.trim() || '',
        achievements: editData.achievements?.trim() || '',
        mood: editData.mood || 3,
        updatedAt: Timestamp.now(),
      });

      // ローカル状態を更新
      setReflections(prev =>
        prev.map(item =>
          item.id === editingId
            ? {
                ...item,
                events: editData.events?.trim() || '',
                thoughts: editData.thoughts?.trim() || '',
                achievements: editData.achievements?.trim() || '',
                mood: editData.mood || 3,
                updatedAt: Timestamp.now(),
              }
            : item
        )
      );

      setEditingId(null);
      setEditData({});
      Alert.alert('更新完了', '記録が正常に更新されました ✓');
    } catch (error) {
      console.error('更新エラー:', error);
      Alert.alert('エラー', '更新に失敗しました。再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  // 削除確認
  const confirmDelete = (reflection: ReflectionData) => {
    Alert.alert(
      '削除確認',
      `${formatDate(reflection.date)}の記録を削除しますか？\n\nこの操作は元に戻せません。`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteReflection(reflection.id),
        },
      ]
    );
  };

  // 削除実行
  const deleteReflection = async (id: string) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'dailyReflections', id);
      await deleteDoc(docRef);

      // ローカル状態を更新
      setReflections(prev => prev.filter(item => item.id !== id));
      Alert.alert('削除完了', '記録が正常に削除されました ✓');
    } catch (error) {
      console.error('削除エラー:', error);
      Alert.alert('エラー', '削除に失敗しました。再度お試しください。');
    }
  };

  // テキスト変更時の処理（改行対応）
  const handleTextChange = (field: 'events' | 'thoughts' | 'achievements', text: string) => {
    const prevText = editData[field] || '';
    
    // 改行が追加されたかチェック
    if (text.length > prevText.length && text.endsWith('\n')) {
      // 最後の行をチェック
      const lines = text.split('\n');
      const lastLine = lines[lines.length - 2]; // 改行前の行
      
      // 前の行が箇条書きで、かつ内容があるなら次の行も箇条書きにする
      if (lastLine && lastLine.trim().startsWith('•') && lastLine.trim().length > 1) {
        // setTimeoutを使用して非同期に更新し、フォーカスを維持
        setTimeout(() => {
          setEditData(prev => ({ ...prev, [field]: text + '• ' }));
        }, 0);
        return;
      }
    }
    
    setEditData(prev => ({ ...prev, [field]: text }));
  };

  // 編集用テキストエリア
  const EditableTextArea: React.FC<{
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    style: any;
    numberOfLines?: number;
    field: string;
  }> = ({ value, onChangeText, placeholder, style, numberOfLines = 3, field }) => (
    <ThemedView style={styles.editInputContainer} pointerEvents="auto">
      <ThemedText style={styles.editPrompt}>$ </ThemedText>
      <TextInput
        key={`${editingId}-${field}`}
        style={[styles.editTextInput, style]}
        multiline
        numberOfLines={numberOfLines}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        returnKeyType="default"
        blurOnSubmit={false}
        keyboardType="default"
        autoCorrect={false}
        autoFocus={false}
      />
    </ThemedView>
  );

  // テキストをリスト形式で表示するコンポーネント
  const ListText: React.FC<{ 
    text: string; 
    numberOfLines?: number; 
    style: any; 
    id: string; 
    section: string;
  }> = ({ text, numberOfLines, style, id, section }) => {
    const lines = text.split('\n').filter(line => line.trim());
    const itemKey = `${id}-${section}`;
    const isExpanded = expandedItems[itemKey];
    const hasMultipleItems = lines.length > 2;
    
    const toggleExpand = () => {
      setExpandedItems(prev => ({
        ...prev,
        [itemKey]: !prev[itemKey]
      }));
    };

    if (lines.length <= 1) {
      // 単一行の場合は通常表示
      return <ThemedText style={style} numberOfLines={numberOfLines}>{text}</ThemedText>;
    }

    // 複数行の場合はリスト表示
    const displayLines = (isExpanded || !hasMultipleItems) ? lines : lines.slice(0, 2);
    
    return (
      <ThemedView style={styles.listContainer}>
        {displayLines.map((line, index) => {
          const trimmedLine = line.trim();
          const isBulletPoint = trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*');
          const displayText = isBulletPoint ? trimmedLine : `• ${trimmedLine}`;
          
          return (
            <ThemedView key={index} style={styles.listItem}>
              <ThemedText style={[style, styles.listItemText]}>
                {displayText}
              </ThemedText>
            </ThemedView>
          );
        })}
        
        {hasMultipleItems && (
          <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={12} 
              color="#8b949e" 
            />
            <ThemedText style={styles.expandText}>
              {isExpanded ? 'COLLAPSE' : `SHOW ALL (${lines.length} items)`}
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    );
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
          keyboardShouldPersistTaps="always"
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
        keyboardShouldPersistTaps="always"
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
          <ThemedView
            key={reflection.id}
            style={[
              styles.reflectionCard,
              editingId === reflection.id && styles.reflectionCardEditing
            ]}
          >
            <View style={styles.cardHeader}>
              <ThemedView style={styles.cardInfo}>
                <Feather name="calendar" size={14} color="#58a6ff" />
                <ThemedText style={styles.cardDate}>
                  {formatDate(reflection.date)}
                </ThemedText>
              </ThemedView>
              
              {/* 編集・削除ボタン */}
              {editingId !== reflection.id ? (
                <ThemedView style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEdit(reflection)}
                  >
                    <Feather name="edit-2" size={12} color="#58a6ff" />
                    <ThemedText style={styles.actionButtonText}>EDIT</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(reflection)}
                  >
                    <Feather name="trash-2" size={12} color="#f85149" />
                    <ThemedText style={[styles.actionButtonText, styles.deleteButtonText]}>DEL</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <ThemedView style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={saveEdit}
                    disabled={saving}
                  >
                    <MaterialIcons name={saving ? "sync" : "save"} size={12} color="#0be881" />
                    <ThemedText style={[styles.actionButtonText, styles.saveButtonText]}>
                      {saving ? 'SAVING' : 'SAVE'}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={cancelEdit}
                  >
                    <Feather name="x" size={12} color="#8b949e" />
                    <ThemedText style={styles.actionButtonText}>CANCEL</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              )}
            </View>

            {/* 気分評価 */}
            <ThemedView style={styles.moodSection}>
              <ThemedView style={styles.moodIndicator}>
                <Feather name="activity" size={12} color={getMoodColor(editingId === reflection.id ? (editData.mood || reflection.mood) : reflection.mood)} />
                <ThemedText style={[styles.cardMood, { color: getMoodColor(editingId === reflection.id ? (editData.mood || reflection.mood) : reflection.mood) }]}>
                  {getMoodText(editingId === reflection.id ? (editData.mood || reflection.mood) : reflection.mood)}
                </ThemedText>
              </ThemedView>
              
              {/* 編集モード時の気分評価 */}
              {editingId === reflection.id && (
                <ThemedView style={styles.editMoodContainer}>
                  {[1, 2, 3, 4, 5].map((mood) => (
                    <TouchableOpacity
                      key={mood}
                      style={[
                        styles.editMoodButton,
                        (editData.mood || reflection.mood) === mood && { 
                          backgroundColor: getMoodColor(mood),
                        }
                      ]}
                      onPress={() => setEditData(prev => ({ ...prev, mood }))}
                    >
                      <ThemedText style={[
                        styles.editMoodButtonText,
                        (editData.mood || reflection.mood) === mood && styles.editMoodButtonTextSelected
                      ]}>
                        {mood}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              )}
            </ThemedView>

            {/* 今日の出来事 */}
            {(reflection.events && reflection.events.trim()) || editingId === reflection.id ? (
              <ThemedView style={styles.cardSection}>
                <ThemedView style={styles.sectionHeader}>
                  <Feather name="edit-3" size={12} color="#8b949e" />
                  <ThemedText style={styles.sectionTitle}>--events</ThemedText>
                </ThemedView>
                {editingId === reflection.id ? (
                  <EditableTextArea
                    value={editData.events || ''}
                    onChangeText={(text) => handleTextChange('events', text)}
                    placeholder="今日の出来事を入力..."
                    style={styles.sectionContent}
                    numberOfLines={3}
                    field="events"
                  />
                ) : (
                  <ListText 
                    text={reflection.events} 
                    style={styles.sectionContent}
                    id={reflection.id}
                    section="events"
                  />
                )}
              </ThemedView>
            ) : null}

            {/* 考察・感情 */}
            {(reflection.thoughts && reflection.thoughts.trim()) || editingId === reflection.id ? (
              <ThemedView style={styles.cardSection}>
                <ThemedView style={styles.sectionHeader}>
                  <Feather name="message-circle" size={12} color="#8b949e" />
                  <ThemedText style={styles.sectionTitle}>--thoughts</ThemedText>
                </ThemedView>
                {editingId === reflection.id ? (
                  <EditableTextArea
                    value={editData.thoughts || ''}
                    onChangeText={(text) => handleTextChange('thoughts', text)}
                    placeholder="思考や感情を入力..."
                    style={styles.sectionContent}
                    numberOfLines={3}
                    field="thoughts"
                  />
                ) : (
                  <ListText 
                    text={reflection.thoughts} 
                    style={styles.sectionContent}
                    id={reflection.id}
                    section="thoughts"
                  />
                )}
              </ThemedView>
            ) : null}

            {/* 成功体験・知識・スキル */}
            <ThemedView style={styles.cardSection}>
              <ThemedView style={styles.sectionHeader}>
                <Feather name="target" size={12} color="#0be881" />
                <ThemedText style={[styles.sectionTitle, styles.achievementTitle]}>--achievements</ThemedText>
              </ThemedView>
              {editingId === reflection.id ? (
                <EditableTextArea
                  value={editData.achievements || ''}
                  onChangeText={(text) => handleTextChange('achievements', text)}
                  placeholder="成功体験や学んだことを入力..."
                  style={styles.achievementContent}
                  numberOfLines={4}
                  field="achievements"
                />
              ) : (
                <ListText 
                  text={reflection.achievements} 
                  style={styles.achievementContent}
                  id={reflection.id}
                  section="achievements"
                />
              )}
            </ThemedView>
          </ThemedView>
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
  listContainer: {
    backgroundColor: 'transparent',
  },
  listItem: {
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  listItemText: {
    paddingLeft: 0,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
  },
  expandText: {
    fontSize: 11,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginLeft: 4,
    textDecorationLine: 'underline',
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
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#161b22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363d',
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  editPrompt: {
    color: '#0be881',
    fontFamily: 'monospace',
    fontSize: 14,
    marginRight: 4,
  },
  editTextInput: {
    flex: 1,
    color: '#f0f6fc',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 0,
    minHeight: 40,
  },
  reflectionCardEditing: {
    borderLeftColor: '#0be881',
    borderColor: '#0be881',
    backgroundColor: '#0f1419',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  deleteButton: {
    borderColor: '#f85149',
  },
  saveButton: {
    borderColor: '#0be881',
  },
  actionButtonText: {
    fontSize: 10,
    color: '#8b949e',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#f85149',
  },
  saveButtonText: {
    color: '#0be881',
  },
  moodSection: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  editMoodContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  editMoodButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: '#161b22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editMoodButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b949e',
    fontFamily: 'monospace',
  },
  editMoodButtonTextSelected: {
    color: '#0d1117',
  },
}); 