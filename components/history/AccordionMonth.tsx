import { Feather } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { getMoodColor } from '../../utils/moodUtils';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { AccordionWeek } from './AccordionWeek';

export interface ReflectionData {
  id: string;
  date: Timestamp;
  events: string;
  thoughts: string;
  achievements: string;
  mood: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MonthData {
  year: number;
  month: number;
  weeks: WeekData[];
  totalRecords: number;
  averageMood: number;
}

export interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: ReflectionData[];
  totalRecords: number;
  averageMood: number;
}

interface AccordionMonthProps {
  monthData: MonthData;
  onEditReflection: (reflection: ReflectionData) => void;
  onDeleteReflection: (reflection: ReflectionData) => void;
}

export const AccordionMonth: React.FC<AccordionMonthProps> = ({
  monthData,
  onEditReflection,
  onDeleteReflection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMonthName = (month: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
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
            size={16} 
            color="#58a6ff" 
          />
          <ThemedText style={styles.monthTitle}>
            {getMonthName(monthData.month)} {monthData.year}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.headerRight}>
          <ThemedView style={styles.statsContainer}>
            <ThemedText style={styles.recordCount}>
              {monthData.totalRecords} records
            </ThemedText>
            <ThemedView style={styles.moodIndicator}>
              <Feather 
                name="activity" 
                size={12} 
                color={getMoodColor(monthData.averageMood)} 
              />
              <ThemedText style={[
                styles.averageMood,
                { color: getMoodColor(monthData.averageMood) }
              ]}>
                {formatAverage(monthData.averageMood)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>

      {isExpanded && (
        <ThemedView style={styles.content}>
          {monthData.weeks.map((weekData, index) => (
            <AccordionWeek
              key={`${monthData.year}-${monthData.month}-week-${index}`}
              weekData={weekData}
              onEditReflection={onEditReflection}
              onDeleteReflection={onDeleteReflection}
            />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161b22',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363d',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#21262d',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
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
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#58a6ff',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  statsContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  recordCount: {
    fontSize: 12,
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
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    backgroundColor: 'transparent',
  },
}); 