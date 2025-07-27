import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface SearchBarProps {
  searchKeyword: string;
  selectedMood: number | null;
  onSearchChange: (text: string) => void;
  onMoodChange: (mood: number | null) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchKeyword,
  selectedMood,
  onSearchChange,
  onMoodChange,
  onClear,
}) => {
  const getMoodColor = (mood: number) => {
    const moodColors = ['', '#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#0be881'];
    return moodColors[mood];
  };

  const getMoodText = (mood: number) => {
    const moodTexts = ['', 'CRITICAL', 'ERROR', 'WARNING', 'SUCCESS', 'OPTIMAL'];
    return moodTexts[mood];
  };

  return (
    <ThemedView style={styles.container}>
      {/* 検索バー */}
      <ThemedView style={styles.searchContainer}>
        <Feather name="search" size={16} color="#58a6ff" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search records..."
          placeholderTextColor="#8b949e"
          value={searchKeyword}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {(searchKeyword || selectedMood) && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Feather name="x" size={16} color="#8b949e" />
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* ムードフィルター */}
      <ThemedView style={styles.moodContainer}>
        <ThemedText style={styles.filterLabel}>--mood-filter</ThemedText>
        <ThemedView style={styles.moodButtons}>
          <TouchableOpacity
            style={[
              styles.moodButton,
              !selectedMood && styles.moodButtonSelected
            ]}
            onPress={() => onMoodChange(null)}
          >
            <ThemedText style={[
              styles.moodButtonText,
              !selectedMood && styles.moodButtonTextSelected
            ]}>
              ALL
            </ThemedText>
          </TouchableOpacity>
          
          {[1, 2, 3, 4, 5].map((mood) => (
            <TouchableOpacity
              key={mood}
              style={[
                styles.moodButton,
                selectedMood === mood && {
                  backgroundColor: getMoodColor(mood),
                  borderColor: getMoodColor(mood),
                }
              ]}
              onPress={() => onMoodChange(mood)}
            >
              <ThemedText style={[
                styles.moodButtonText,
                selectedMood === mood && { color: '#0d1117' }
              ]}>
                {mood}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
        
        {selectedMood && (
          <ThemedText style={[styles.selectedMoodText, { color: getMoodColor(selectedMood) }]}>
            {getMoodText(selectedMood)}
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#f0f6fc',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  moodContainer: {
    backgroundColor: 'transparent',
  },
  filterLabel: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  moodButtons: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  moodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: '#0d1117',
  },
  moodButtonSelected: {
    backgroundColor: '#58a6ff',
    borderColor: '#58a6ff',
  },
  moodButtonText: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  moodButtonTextSelected: {
    color: '#0d1117',
  },
  selectedMoodText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 8,
  },
}); 