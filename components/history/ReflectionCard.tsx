import { Feather } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ReflectionData } from './AccordionMonth';

interface ReflectionCardProps {
  reflection: ReflectionData;
  onEdit: (reflection: ReflectionData) => void;
  onDelete: (reflection: ReflectionData) => void;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  reflection,
  onEdit,
  onDelete,
}) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

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
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  // セクション展開/折りたたみ
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // テキストをリスト形式で表示するコンポーネント
  const ListText: React.FC<{ 
    text: string; 
    numberOfLines?: number; 
    style: any; 
    section: string;
  }> = ({ text, numberOfLines, style, section }) => {
    const lines = text.split('\n').filter(line => line.trim());
    const isExpanded = expandedSections[section];
    const hasMultipleItems = lines.length > 2;
    
    if (lines.length <= 1) {
      return <ThemedText style={style} numberOfLines={numberOfLines}>{text}</ThemedText>;
    }

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
          <TouchableOpacity onPress={() => toggleSection(section)} style={styles.expandButton}>
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={10} 
              color="#8b949e" 
            />
            <ThemedText style={styles.expandText}>
              {isExpanded ? 'COLLAPSE' : `SHOW ALL (${lines.length})`}
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Record',
      `Delete ${formatDate(reflection.date)} record?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(reflection) },
      ]
    );
  };

  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedView style={styles.cardInfo}>
          <Feather name="calendar" size={12} color="#58a6ff" />
          <ThemedText style={styles.cardDate}>
            {formatDate(reflection.date)}
          </ThemedText>
          <ThemedView style={styles.moodIndicator}>
            <Feather name="activity" size={10} color={getMoodColor(reflection.mood)} />
            <ThemedText style={[styles.cardMood, { color: getMoodColor(reflection.mood) }]}>
              {getMoodText(reflection.mood)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(reflection)}
          >
            <Feather name="edit-2" size={10} color="#58a6ff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={confirmDelete}
          >
            <Feather name="trash-2" size={10} color="#f85149" />
          </TouchableOpacity>
        </ThemedView>
      </View>

      {/* 今日の出来事 */}
      {reflection.events && reflection.events.trim() && (
        <ThemedView style={styles.cardSection}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="edit-3" size={10} color="#8b949e" />
            <ThemedText style={styles.sectionTitle}>--events</ThemedText>
          </ThemedView>
          <ListText 
            text={reflection.events} 
            style={styles.sectionContent}
            section="events"
          />
        </ThemedView>
      )}

      {/* 考察・感情 */}
      {reflection.thoughts && reflection.thoughts.trim() && (
        <ThemedView style={styles.cardSection}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="message-circle" size={10} color="#8b949e" />
            <ThemedText style={styles.sectionTitle}>--thoughts</ThemedText>
          </ThemedView>
          <ListText 
            text={reflection.thoughts} 
            style={styles.sectionContent}
            section="thoughts"
          />
        </ThemedView>
      )}

      {/* 成功体験・知識・スキル */}
      <ThemedView style={styles.cardSection}>
        <ThemedView style={styles.sectionHeader}>
          <Feather name="target" size={10} color="#0be881" />
          <ThemedText style={[styles.sectionTitle, styles.achievementTitle]}>--achievements</ThemedText>
        </ThemedView>
        <ListText 
          text={reflection.achievements} 
          style={styles.achievementContent}
          section="achievements"
        />
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161b22',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#30363d',
    borderLeftWidth: 2,
    borderLeftColor: '#58a6ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58a6ff',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  cardMood: {
    fontSize: 10,
    marginLeft: 3,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'transparent',
  },
  actionButton: {
    padding: 6,
    borderRadius: 3,
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  deleteButton: {
    borderColor: '#f85149',
  },
  cardSection: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8b949e',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  achievementTitle: {
    color: '#0be881',
  },
  sectionContent: {
    fontSize: 12,
    lineHeight: 16,
    color: '#f0f6fc',
    fontFamily: 'monospace',
    paddingLeft: 14,
  },
  achievementContent: {
    fontSize: 12,
    lineHeight: 16,
    color: '#0be881',
    fontFamily: 'monospace',
    fontWeight: '500',
    paddingLeft: 14,
  },
  listContainer: {
    backgroundColor: 'transparent',
  },
  listItem: {
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  listItemText: {
    paddingLeft: 0,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 2,
  },
  expandText: {
    fontSize: 9,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginLeft: 3,
    textDecorationLine: 'underline',
  },
}); 