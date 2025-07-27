import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ReflectionData, WeekData } from './AccordionMonth';
import { ReflectionCard } from './ReflectionCard';

interface AccordionWeekProps {
  weekData: WeekData;
  onEditReflection: (reflection: ReflectionData) => void;
  onDeleteReflection: (reflection: ReflectionData) => void;
}

export const AccordionWeek: React.FC<AccordionWeekProps> = ({
  weekData,
  onEditReflection,
  onDeleteReflection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
      });
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getMoodColor = (mood: number) => {
    const moodColors = ['', '#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#0be881'];
    return moodColors[Math.round(mood)];
  };

  const formatAverage = (average: number) => {
    return average.toFixed(1);
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedView style={styles.headerLeft}>
          <Feather 
            name={isExpanded ? "chevron-down" : "chevron-right"} 
            size={14} 
            color="#f79000" 
          />
          <ThemedText style={styles.weekTitle}>
            Week {weekData.weekNumber}
          </ThemedText>
          <ThemedText style={styles.dateRange}>
            {formatDateRange(weekData.startDate, weekData.endDate)}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.headerRight}>
          <ThemedView style={styles.statsContainer}>
            <ThemedText style={styles.recordCount}>
              {weekData.totalRecords} days
            </ThemedText>
            {weekData.totalRecords > 0 && (
              <ThemedView style={styles.moodIndicator}>
                <Feather 
                  name="activity" 
                  size={10} 
                  color={getMoodColor(weekData.averageMood)} 
                />
                <ThemedText style={[
                  styles.averageMood,
                  { color: getMoodColor(weekData.averageMood) }
                ]}>
                  {formatAverage(weekData.averageMood)}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>

      {isExpanded && (
        <ThemedView style={styles.content}>
          {weekData.days.length > 0 ? (
            weekData.days.map((reflection) => (
              <ReflectionCard
                key={reflection.id}
                reflection={reflection}
                onEdit={onEditReflection}
                onDelete={onDeleteReflection}
              />
            ))
          ) : (
            <ThemedView style={styles.emptyContent}>
              <Feather name="calendar" size={16} color="#8b949e" />
              <ThemedText style={styles.emptyText}>
                No records for this week
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 24,
    backgroundColor: '#1c2128',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  headerRight: {
    backgroundColor: 'transparent',
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f79000',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  dateRange: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  statsContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  recordCount: {
    fontSize: 11,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  averageMood: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    backgroundColor: '#0d1117',
    paddingLeft: 16,
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
}); 