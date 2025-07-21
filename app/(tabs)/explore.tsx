import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase.config';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

// 振り返りデータの型定義
interface ReflectionData {
  date: Timestamp;
  events: string;          // 今日の出来事
  thoughts: string;        // 考察・感情
  achievements: string;    // 成功体験や新しい知識・スキル
  mood: number;           // 気分評価（1-5）
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
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 気分評価の文字列変換
  const getMoodText = (mood: number) => {
    const moodTexts = ['', '😞 とても悪い', '😕 悪い', '😐 普通', '😊 良い', '😄 とても良い'];
    return moodTexts[mood];
  };

  // フォーム送信処理
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    // バリデーション（成功体験・知識は必須）
    if (!formData.achievements.trim()) {
      Alert.alert('入力エラー', '今日の成功体験や新しい知識・スキルを入力してください');
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
      
      Alert.alert('保存完了', '今日の振り返りを保存しました！\n小さな成長も積み重ねが大切ですね✨', [
        {
          text: 'OK',
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
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>今日の成長記録</ThemedText>
        <ThemedText style={styles.date}>{todayString}</ThemedText>
        <ThemedText style={styles.subtitle}>小さな成功も大きな一歩 🌱</ThemedText>
      </ThemedView>

      <ThemedView style={styles.form}>
        {/* 今日の出来事 */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedText style={styles.label}>今日の出来事</ThemedText>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={3}
            placeholder="今日はどんなことがありましたか？"
            value={formData.events}
            onChangeText={(text) => setFormData(prev => ({ ...prev, events: text }))}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </ThemedView>

        {/* 考察・感情 */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedText style={styles.label}>それに対する考察・感情</ThemedText>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={3}
            placeholder="どんな気持ちになりましたか？どう思いましたか？"
            value={formData.thoughts}
            onChangeText={(text) => setFormData(prev => ({ ...prev, thoughts: text }))}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </ThemedView>

        {/* 成功体験・新しい知識・スキル */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedText style={styles.label}>今日の成功体験や新しく得た知識・スキル *</ThemedText>
          <TextInput
            style={[styles.textInput, styles.requiredField]}
            multiline
            numberOfLines={4}
            placeholder="どんな小さなことでも構いません！"
            value={formData.achievements}
            onChangeText={(text) => setFormData(prev => ({ ...prev, achievements: text }))}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </ThemedView>

        {/* 気分評価 */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedText style={styles.label}>今日の気分は？</ThemedText>
          <ThemedView style={styles.moodContainer}>
            {[1, 2, 3, 4, 5].map((mood) => (
              <TouchableOpacity
                key={mood}
                style={[
                  styles.moodButton,
                  formData.mood === mood && styles.moodButtonSelected
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
          <ThemedText style={styles.moodText}>{getMoodText(formData.mood)}</ThemedText>
        </ThemedView>

        {/* 保存ボタン */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <ThemedText style={styles.submitButtonText}>
            {isLoading ? '保存中...' : '今日の成長を記録する 🌟'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    marginBottom: 80,
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2d7d46',
  },
  date: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.6,
    color: '#4a9960',
  },
  form: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  fieldContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requiredField: {
    borderColor: '#4a9960',
    borderWidth: 2,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodButtonSelected: {
    borderColor: '#4a9960',
    backgroundColor: '#4a9960',
  },
  moodButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  moodButtonTextSelected: {
    color: '#ffffff',
  },
  moodText: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  submitButton: {
    backgroundColor: '#4a9960',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    // marginTop: 16,
    marginBottom: 16,
    shadowColor: '#4a9960',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
