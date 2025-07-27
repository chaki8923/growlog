import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.info}>
        <Feather name="database" size={12} color="#8b949e" />
        <ThemedText style={styles.infoText}>
          Showing {startItem}-{endItem} of {totalItems} records
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.controls}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={14} color={currentPage === 1 ? "#30363d" : "#58a6ff"} />
        </TouchableOpacity>

        {/* Page Numbers */}
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <ThemedView style={styles.dotsContainer}>
                <ThemedText style={styles.dotsText}>...</ThemedText>
              </ThemedView>
            ) : (
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  currentPage === page && styles.activePageButton
                ]}
                onPress={() => onPageChange(page as number)}
              >
                <ThemedText style={[
                  styles.pageText,
                  currentPage === page && styles.activePageText
                ]}>
                  {page}
                </ThemedText>
              </TouchableOpacity>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Feather name="chevron-right" size={14} color={currentPage === totalPages ? "#30363d" : "#58a6ff"} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  infoText: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginLeft: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: '#0d1117',
    minWidth: 36,
    alignItems: 'center',
  },
  activePageButton: {
    backgroundColor: '#58a6ff',
    borderColor: '#58a6ff',
  },
  disabledButton: {
    backgroundColor: '#161b22',
    borderColor: '#30363d',
  },
  pageText: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  activePageText: {
    color: '#0d1117',
  },
  dotsContainer: {
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  dotsText: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
  },
}); 