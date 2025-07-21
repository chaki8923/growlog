import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase.config';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

// 振り返りデータの型定義
interface ReflectionData {
  date: Timestamp;
  events: string;
  thoughts: string;
  achievements: string;
  mood: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // フォームの状態管理
  const [formData, setFormData] = useState({
    events: '',
    thoughts: '',
    achievements: '',
    mood: 3,
  });

  // 今日の日付を取得
  const today = new Date();
  const todayString = today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

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

  // フォーム送信処理
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('認証エラー', 'ログインが必要です');
      return;
    }

    // バリデーション（成功体験・知識は必須）
    if (!formData.achievements.trim()) {
      Alert.alert('入力エラー', '成功体験や新しい知識・スキルの入力は必須です');
      return;
    }

    setIsLoading(true);

    try {
      const now = Timestamp.now();
      const reflectionData: ReflectionData = {
        date: Timestamp.fromDate(today),
        events: formData.events.trim(),
        thoughts: formData.thoughts.trim(),
        achievements: formData.achievements.trim(),
        mood: formData.mood,
        createdAt: now,
        updatedAt: now,
      };

      // Firestoreに保存
      await addDoc(collection(db, 'users', user.uid, 'dailyReflections'), reflectionData);

      Alert.alert('保存完了', '今日の成長記録をクラウドに保存しました ✓\nあなたの成長データは安全に暗号化されて保存されています', [
        {
          text: '続ける',
          onPress: () => {
            // フォームをリセット
            setFormData({
              events: '',
              thoughts: '',
              achievements: '',
              mood: 3,
            });
          }
        }
      ]);
    } catch (error) {
      console.error('保存エラー:', error);
      Alert.alert('ネットワークエラー', 'クラウドとの同期に失敗しました。再度お試しください');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ヘッダー - ターミナル風 */}
      <ThemedView style={styles.terminal}>
        <ThemedView style={styles.terminalHeader}>
          <ThemedView style={styles.terminalButtons}>
            <ThemedView style={[styles.terminalButton, styles.redButton]} />
            <ThemedView style={[styles.terminalButton, styles.yellowButton]} />
            <ThemedView style={[styles.terminalButton, styles.greenButton]} />
          </ThemedView>
          <ThemedText style={styles.terminalTitle}>growth-tracker v2.0.1</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.terminalContent}>
          <ThemedText style={styles.promptLine}>
            <ThemedText style={styles.prompt}>user@growlog:~$ </ThemedText>
            <ThemedText style={styles.command}>./capture_growth --date {todayString}</ThemedText>
          </ThemedText>
          <ThemedText style={styles.systemInfo}>
            [INFO] Initializing growth capture module...
          </ThemedText>
          <ThemedText style={styles.systemInfo}>
            [INFO] AI analysis system ready. Begin data input.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.form}>
        {/* 今日の出来事 */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedView style={styles.labelContainer}>
            <Feather name="edit-3" size={16} color="#58a6ff" style={styles.labelIcon} />
            <ThemedText style={styles.label}>
              <ThemedText style={styles.flag}>--events</ThemedText>
              <ThemedText style={styles.labelDesc}> Daily activity log (optional)</ThemedText>
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputPrompt}>$ </ThemedText>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={3}
              placeholder="今日はどんなことがありましたか？"
              placeholderTextColor="#666"
              value={formData.events}
              onChangeText={(text) => setFormData(prev => ({ ...prev, events: text }))}
              blurOnSubmit={true}
            />
          </ThemedView>
        </ThemedView>

        {/* 考察・感情 */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedView style={styles.labelContainer}>
            <Feather name="message-circle" size={16} color="#58a6ff" style={styles.labelIcon} />
            <ThemedText style={styles.label}>
              <ThemedText style={styles.flag}>--thoughts</ThemedText>
              <ThemedText style={styles.labelDesc}> Cognitive analysis (optional)</ThemedText>
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputPrompt}>$ </ThemedText>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={3}
              placeholder="どんな気持ちになりましたか？どう思いましたか？"
              placeholderTextColor="#666"
              value={formData.thoughts}
              onChangeText={(text) => setFormData(prev => ({ ...prev, thoughts: text }))}
              blurOnSubmit={true}
            />
          </ThemedView>
        </ThemedView>

        {/* 成功体験・新しい知識・スキル */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedView style={styles.labelContainer}>
            <Feather name="target" size={16} color="#58a6ff" style={styles.labelIcon} />
            <ThemedText style={styles.label}>
              <ThemedText style={styles.flag}>--achievements*</ThemedText>
              <ThemedText style={styles.labelDesc}> Growth metrics (required)</ThemedText>
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputPrompt}>$ </ThemedText>
            <TextInput
              style={[styles.textInput, styles.requiredField]}
              multiline
              numberOfLines={4}
              placeholder="どんな小さなことでも構いません！{'\n'}・新しく覚えたこと{'\n'}・うまくいったこと{'\n'}・身についたスキル など"
              placeholderTextColor="#666"
              value={formData.achievements}
              onChangeText={(text) => setFormData(prev => ({ ...prev, achievements: text }))}
              blurOnSubmit={true}
            />
          </ThemedView>
        </ThemedView>

        {/* 気分評価 */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedView style={styles.labelContainer}>
            <Feather name="activity" size={16} color="#58a6ff" style={styles.labelIcon} />
            <ThemedText style={styles.label}>
              <ThemedText style={styles.flag}>--mood</ThemedText>
              <ThemedText style={styles.labelDesc}> feeling today?</ThemedText>
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.moodContainer}>
            {[1, 2, 3, 4, 5].map((mood) => (
              <TouchableOpacity
                key={mood}
                style={[
                  styles.moodButton,
                  formData.mood === mood && { 
                    backgroundColor: getMoodColor(mood),
                    shadowColor: getMoodColor(mood),
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    elevation: 8,
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, mood }))}
              >
                <ThemedText style={[
                  styles.moodButtonText,
                  formData.mood === mood && styles.moodButtonTextSelected
                ]}>
                  {mood}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
          <ThemedText style={[styles.moodText, { color: getMoodColor(formData.mood) }]}>
            STATUS: {getMoodText(formData.mood)}
          </ThemedText>
        </ThemedView>

        {/* 保存ボタン */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <MaterialIcons 
            name={isLoading ? "sync" : "cloud-upload"} 
            size={16} 
            color="#ffffff" 
            style={styles.buttonIcon}
          />
          <ThemedText style={styles.submitButtonText}>
            {isLoading ? '[UPLOADING...] ░░░░░░░░░░' : '[EXECUTE]  SAVE'}
          </ThemedText>
        </TouchableOpacity>

        {/* ステータス表示 */}
        <ThemedView style={styles.statusBar}>
          <ThemedView style={styles.statusItem}>
            <Feather name="wifi" size={10} color="#0be881" />
            <ThemedText style={styles.statusText}> Connected to growth.ai</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statusItem}>
            <Feather name="shield" size={10} color="#58a6ff" />
            <ThemedText style={styles.statusText}> Encryption: AES-256</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    marginBottom: 80,
    flex: 1,
    backgroundColor: '#0d1117', // GitHub dark
  },
  contentContainer: {
    paddingBottom: 32,
  },
  terminal: {
    margin: 16,
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
  form: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  fieldContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    flex: 1,
  },
  flag: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#58a6ff',
    fontFamily: 'monospace',
  },
  labelDesc: {
    fontSize: 14,
    color: '#8b949e',
    fontFamily: 'monospace',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#161b22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363d',
    padding: 12,
  },
  inputPrompt: {
    color: '#0be881',
    fontFamily: 'monospace',
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#f0f6fc',
    fontFamily: 'monospace',
    textAlignVertical: 'top',
    minHeight: 60,
    lineHeight: 20,
  },
  requiredField: {
    borderColor: '#f85149',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#30363d',
    backgroundColor: '#161b22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b949e',
    fontFamily: 'monospace',
  },
  moodButtonTextSelected: {
    color: '#0d1117',
  },
  moodText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#238636',
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2ea043',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#21262d',
    borderColor: '#30363d',
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statusBar: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0d1117',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#8b949e',
  },
});
