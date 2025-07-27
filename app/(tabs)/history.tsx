import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AccordionMonth, ReflectionData, WeekData } from '@/components/history/AccordionMonth';
import { Pagination } from '@/components/history/Pagination';
import { SearchBar } from '@/components/history/SearchBar';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase.config';
import { getMoodColor, getMoodText } from '@/utils/moodUtils';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MonthData {
  year: number;
  month: number;
  weeks: WeekData[];
  totalRecords: number;
  averageMood: number;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<ReflectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 検索・フィルター状態
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  
  // ページング状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 月毎表示なので少なく設定
  
  // 編集モーダル関連の状態
  const [editingReflection, setEditingReflection] = useState<ReflectionData | null>(null);
  const [editData, setEditData] = useState<Partial<ReflectionData>>({});
  const [saving, setSaving] = useState(false);

  // 週の開始日を取得（月曜日始まり）
  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // 月曜日を週の開始とする
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // 週番号を取得
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // データを月・週・日でグループ化
  const groupedData = useMemo(() => {
    // 検索・フィルターを適用
    let filteredReflections = reflections;
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filteredReflections = filteredReflections.filter(reflection =>
        reflection.events.toLowerCase().includes(keyword) ||
        reflection.thoughts.toLowerCase().includes(keyword) ||
        reflection.achievements.toLowerCase().includes(keyword)
      );
    }
    
    if (selectedMood) {
      filteredReflections = filteredReflections.filter(reflection =>
        reflection.mood === selectedMood
      );
    }

    // 月毎にグループ化
    const monthGroups = new Map<string, ReflectionData[]>();
    
    filteredReflections.forEach(reflection => {
      const date = reflection.date.toDate();
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthGroups.has(key)) {
        monthGroups.set(key, []);
      }
      monthGroups.get(key)!.push(reflection);
    });

    // 月データを作成
    const months: MonthData[] = [];
    
    monthGroups.forEach((monthReflections, key) => {
      const [year, month] = key.split('-').map(Number);
      
      // 週毎にグループ化
      const weekGroups = new Map<string, { reflections: ReflectionData[], weekStart: Date, weekEnd: Date }>();
      
      monthReflections.forEach(reflection => {
        const date = reflection.date.toDate();
        const weekStart = getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999); // 週の最後まで
        
        // ローカル日付文字列をキーとして使用（タイムゾーン問題を回避）
        const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, { reflections: [], weekStart, weekEnd });
        }
        weekGroups.get(weekKey)!.reflections.push(reflection);
      });

      // 週データを作成
      const weeks: WeekData[] = [];
      
      weekGroups.forEach(({ reflections: weekReflections, weekStart, weekEnd }) => {
        // 日付順にソート
        weekReflections.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
        
        const totalRecords = weekReflections.length;
        const averageMood = totalRecords > 0 
          ? weekReflections.reduce((sum, r) => sum + r.mood, 0) / totalRecords 
          : 0;

        weeks.push({
          weekNumber: getWeekNumber(weekStart),
          startDate: weekStart,
          endDate: weekEnd,
          days: weekReflections,
          totalRecords,
          averageMood,
        });
      });

      // 週を日付順にソート（新しい週が上）
      weeks.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      const totalRecords = monthReflections.length;
      const averageMood = totalRecords > 0 
        ? monthReflections.reduce((sum, r) => sum + r.mood, 0) / totalRecords 
        : 0;

      months.push({
        year,
        month,
        weeks,
        totalRecords,
        averageMood,
      });
    });

    // 月を日付順にソート（新しい月が上）
    months.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return months;
  }, [reflections, searchKeyword, selectedMood]);

  // ページング適用
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return groupedData.slice(startIndex, endIndex);
  }, [groupedData, currentPage, itemsPerPage]);

  // 編集モードを開始
  const startEdit = (reflection: ReflectionData) => {
    setEditingReflection(reflection);
    setEditData({
      events: reflection.events,
      thoughts: reflection.thoughts,
      achievements: reflection.achievements,
      mood: reflection.mood,
    });
  };

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditingReflection(null);
    setEditData({});
  };

  // 編集を保存
  const saveEdit = async () => {
    if (!user || !editingReflection) return;

    // バリデーション
    if (!editData.achievements?.trim()) {
      Alert.alert('入力エラー', '成功体験・学んだことの入力は必須です');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'dailyReflections', editingReflection.id);
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
          item.id === editingReflection.id
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

      setEditingReflection(null);
      setEditData({});
      Alert.alert('更新完了', '記録が正常に更新されました ✓');
    } catch (error) {
      console.error('更新エラー:', error);
      Alert.alert('エラー', '更新に失敗しました。再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  // 削除実行
  const deleteReflection = async (reflection: ReflectionData) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'dailyReflections', reflection.id);
      await deleteDoc(docRef);

      // ローカル状態を更新
      setReflections(prev => prev.filter(item => item.id !== reflection.id));
      Alert.alert('削除完了', '記録が正常に削除されました ✓');
    } catch (error) {
      console.error('削除エラー:', error);
      Alert.alert('エラー', '削除に失敗しました。再度お試しください。');
    }
  };

  // テキスト変更時の処理（改行対応・リスト形式機能）
  const handleTextChange = (field: 'events' | 'thoughts' | 'achievements', text: string) => {
    const prevText = editData[field] || '';
    
    // 改行が追加されたかチェック
    if (text.length > prevText.length && text.endsWith('\n')) {
      // 最後の行をチェック
      const lines = text.split('\n');
      const lastLine = lines[lines.length - 2]; // 改行前の行
      
      // 前の行が箇条書きで、かつ内容があるなら次の行も箇条書きにする
      if (lastLine && lastLine.trim().startsWith('•') && lastLine.trim().length > 1) {
        setEditData(prev => ({ ...prev, [field]: text + '• ' }));
        return;
      }
    }
    
    setEditData(prev => ({ ...prev, [field]: text }));
  };

  // 各フィールド用の安定したハンドラー
  const handleEventsChange = (text: string) => handleTextChange('events', text);
  const handleThoughtsChange = (text: string) => handleTextChange('thoughts', text);
  const handleAchievementsChange = (text: string) => handleTextChange('achievements', text);

  // 検索・フィルターのクリア
  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedMood(null);
    setCurrentPage(1);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  // 検索・フィルター変更時にページをリセット
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedMood]);

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
              <ThemedText style={styles.terminalTitle}>growth-history v3.0.0</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.terminalContent}>
              <ThemedText style={styles.promptLine}>
                <ThemedText style={styles.prompt}>user@growlog:~$ </ThemedText>
                <ThemedText style={styles.command}>./list_records --format accordion</ThemedText>
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

  const totalPages = Math.ceil(groupedData.length / itemsPerPage);
  const hasFilters = searchKeyword || selectedMood;

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
            <ThemedText style={styles.terminalTitle}>growth-history v3.0.0</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.terminalContent}>
            <ThemedText style={styles.promptLine}>
              <ThemedText style={styles.prompt}>user@growlog:~$ </ThemedText>
              <ThemedText style={styles.command}>
                ./list_records --format accordion {hasFilters && '--filtered'}
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.systemInfo}>
              [INFO] Found {reflections.length} total records
            </ThemedText>
            <ThemedText style={styles.systemInfo}>
              [INFO] Displaying {groupedData.length} months ({paginatedData.length} in view)
            </ThemedText>
            {hasFilters && (
              <ThemedText style={[styles.systemInfo, { color: '#f79000' }]}>
                [FILTER] Active filters applied
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        {/* 検索・フィルター */}
        <SearchBar
          searchKeyword={searchKeyword}
          selectedMood={selectedMood}
          onSearchChange={setSearchKeyword}
          onMoodChange={setSelectedMood}
          onClear={clearFilters}
        />

        {/* フィルター結果が空の場合 */}
        {groupedData.length === 0 ? (
          <ThemedView style={styles.noResultsContainer}>
            <Feather name="search" size={32} color="#8b949e" />
            <ThemedText style={styles.noResultsTitle}>NO RESULTS FOUND</ThemedText>
            <ThemedText style={styles.noResultsMessage}>
              No records match your search criteria.{'\n'}
              Try adjusting your search terms or filters.
            </ThemedText>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Feather name="x" size={14} color="#58a6ff" />
              <ThemedText style={styles.clearFiltersText}>CLEAR FILTERS</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <>
            {/* 月毎のアコーディオン表示 */}
            {paginatedData.map((monthData) => (
              <AccordionMonth
                key={`${monthData.year}-${monthData.month}`}
                monthData={monthData}
                onEditReflection={startEdit}
                onDeleteReflection={deleteReflection}
              />
            ))}

            {/* ページング */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={groupedData.length}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* フッター */}
        <ThemedView style={styles.footer}>
          <Feather name="layers" size={16} color="#58a6ff" />
          <ThemedText style={styles.footerText}>
            ACCORDION VIEW - {reflections.length} RECORDS ORGANIZED
          </ThemedText>
        </ThemedView>
      </ScrollView>

      {/* 編集モーダル */}
      {editingReflection && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={cancelEdit}
        >
          <KeyboardAvoidingView
            style={styles.modalKeyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <SafeAreaView style={styles.modalContainer}>
              <ThemedView style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  Edit Record - {editingReflection.date.toDate().toLocaleDateString('ja-JP')}
                </ThemedText>
                <TouchableOpacity onPress={cancelEdit} style={styles.modalCloseButton}>
                  <Feather name="x" size={20} color="#8b949e" />
                </TouchableOpacity>
              </ThemedView>

              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView 
                  style={styles.modalContent} 
                  contentContainerStyle={styles.modalContentContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >
                  {/* 気分評価 */}
                  <ThemedView style={styles.modalSection}>
                    <ThemedText style={styles.modalSectionTitle}>--mood</ThemedText>
                    <ThemedView style={styles.editMoodContainer}>
                      {[1, 2, 3, 4, 5].map((mood) => (
                        <TouchableOpacity
                          key={mood}
                          style={[
                            styles.editMoodButton,
                            (editData.mood || editingReflection.mood) === mood && { 
                              backgroundColor: getMoodColor(mood),
                            }
                          ]}
                          onPress={() => setEditData(prev => ({ ...prev, mood }))}
                        >
                          <ThemedText style={[
                            styles.editMoodButtonText,
                            (editData.mood || editingReflection.mood) === mood && styles.editMoodButtonTextSelected
                          ]}>
                            {mood}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ThemedView>
                    <ThemedText style={[styles.moodLabel, { 
                      color: getMoodColor(editData.mood || editingReflection.mood) 
                    }]}>
                      {getMoodText(editData.mood || editingReflection.mood)}
                    </ThemedText>
                  </ThemedView>

                  {/* 今日の出来事 */}
                  <ThemedView style={styles.modalSection}>
                    <ThemedText style={styles.modalSectionTitle}>--events</ThemedText>
                    <TextInput
                      style={styles.modalInput}
                      multiline
                      numberOfLines={4}
                      value={editData.events || ''}
                      onChangeText={handleEventsChange}
                      placeholder="今日の出来事を入力..."
                      placeholderTextColor="#666"
                      textAlignVertical="top"
                      returnKeyType="default"
                      blurOnSubmit={false}
                    />
                  </ThemedView>

                  {/* 考察・感情 */}
                  <ThemedView style={styles.modalSection}>
                    <ThemedText style={styles.modalSectionTitle}>--thoughts</ThemedText>
                    <TextInput
                      style={styles.modalInput}
                      multiline
                      numberOfLines={4}
                      value={editData.thoughts || ''}
                      onChangeText={handleThoughtsChange}
                      placeholder="思考や感情を入力..."
                      placeholderTextColor="#666"
                      textAlignVertical="top"
                      returnKeyType="default"
                      blurOnSubmit={false}
                    />
                  </ThemedView>

                  {/* 成功体験・知識・スキル */}
                  <ThemedView style={styles.modalSection}>
                    <ThemedText style={[styles.modalSectionTitle, { color: '#0be881' }]}>
                      --achievements *
                    </ThemedText>
                    <TextInput
                      style={[styles.modalInput, styles.achievementInput]}
                      multiline
                      numberOfLines={5}
                      value={editData.achievements || ''}
                      onChangeText={handleAchievementsChange}
                      placeholder="成功体験や学んだことを入力... (必須)"
                      placeholderTextColor="#666"
                      textAlignVertical="top"
                      returnKeyType="default"
                      blurOnSubmit={false}
                    />
                  </ThemedView>
                </ScrollView>
              </TouchableWithoutFeedback>

              <ThemedView style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={cancelEdit}
                >
                  <Feather name="x" size={16} color="#8b949e" />
                  <ThemedText style={styles.modalCancelText}>CANCEL</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                  onPress={saveEdit}
                  disabled={saving}
                >
                  <MaterialIcons name={saving ? "sync" : "save"} size={16} color="#0d1117" />
                  <ThemedText style={styles.modalSaveText}>
                    {saving ? 'SAVING...' : 'SAVE'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
  noResultsContainer: {
    alignItems: 'center',
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 32,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b949e',
    fontFamily: 'monospace',
    marginTop: 12,
    marginBottom: 8,
  },
  noResultsMessage: {
    fontSize: 14,
    color: '#8b949e',
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#58a6ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#58a6ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
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
  // モーダル関連のスタイル
  modalContainer: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  modalKeyboardContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#58a6ff',
    fontFamily: 'monospace',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalContentContainer: {
    paddingBottom: 0,
  },
  modalSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b949e',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#161b22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363d',
    padding: 12,
    fontSize: 14,
    color: '#f0f6fc',
    fontFamily: 'monospace',
    minHeight: 80,
  },
  achievementInput: {
    borderColor: '#0be881',
    minHeight: 100,
  },
  editMoodContainer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  editMoodButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#30363d',
    backgroundColor: '#161b22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editMoodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b949e',
    fontFamily: 'monospace',
  },
  editMoodButtonTextSelected: {
    color: '#0d1117',
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#161b22',
    borderTopWidth: 1,
    borderTopColor: '#30363d',
  },
  modalCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 6,
    paddingVertical: 12,
    gap: 8,
  },
  modalCancelText: {
    fontSize: 14,
    color: '#8b949e',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0be881',
    borderWidth: 1,
    borderColor: '#0be881',
    borderRadius: 6,
    paddingVertical: 12,
    gap: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#30363d',
    borderColor: '#30363d',
  },
  modalSaveText: {
    fontSize: 14,
    color: '#0d1117',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
}); 