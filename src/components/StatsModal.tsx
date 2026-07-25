import React from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, 
  TouchableWithoutFeedback, useWindowDimensions 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Task, Category } from '../context/AppContext';
import type { ThemeColors } from '../theme';

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  categories: Category[];
  colors: ThemeColors;
  isDark: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  visible,
  onClose,
  tasks,
  categories,
  colors,
  isDark,
}) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 800;
  const styles = getStyles(colors, isDark);

  // Core calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Active overdue tasks (due date in the past, not completed)
  const overdueTasks = tasks.filter(t => {
    if (t.completed || !t.deadline) return false;
    return new Date(t.deadline).getTime() < Date.now();
  }).length;

  const activeOnTimeTasks = activeTasks - overdueTasks;

  // Priority count for active tasks
  const priorityCounts = {
    penting: tasks.filter(t => t.priority === 'penting' && !t.completed).length,
    sedang: tasks.filter(t => t.priority === 'sedang' && !t.completed).length,
    santai: tasks.filter(t => t.priority === 'santai' && !t.completed).length,
  };

  // Category task count breakdown (only active tasks)
  const categoryStats = categories.map(cat => {
    const activeCount = tasks.filter(t => t.category === cat.name && !t.completed).length;
    const completedCount = tasks.filter(t => t.category === cat.name && t.completed).length;
    const totalCount = activeCount + completedCount;
    return {
      ...cat,
      activeCount,
      completedCount,
      totalCount,
    };
  }).sort((a, b) => b.activeCount - a.activeCount); // Sort by busiest

  const maxActiveCount = Math.max(...categoryStats.map(c => c.activeCount), 1);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, isLargeScreen && styles.modalOverlayDesktop]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={[styles.modalContainer, isLargeScreen && styles.modalContainerDesktop]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleRow}>
                <Feather name="bar-chart-2" size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>Statistik & Analisis Belajar</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Progress Summary Card */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Kemajuan Belajar Keseluruhan</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressPercentWrapper}>
                    <Text style={styles.progressPercentText}>{completionRate}%</Text>
                    <Text style={styles.progressSubtext}>Selesai</Text>
                  </View>
                  <View style={styles.progressMetricsWrapper}>
                    <View style={styles.metricItem}>
                      <View style={[styles.metricDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.metricLabel}>Total Tugas: </Text>
                      <Text style={styles.metricVal}>{totalTasks}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <View style={[styles.metricDot, { backgroundColor: colors.warning }]} />
                      <Text style={styles.metricLabel}>Tugas Aktif: </Text>
                      <Text style={styles.metricVal}>{activeTasks}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <View style={[styles.metricDot, { backgroundColor: colors.success }]} />
                      <Text style={styles.metricLabel}>Tugas Selesai: </Text>
                      <Text style={styles.metricVal}>{completedTasks}</Text>
                    </View>
                  </View>
                </View>
                {/* Visual Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${completionRate}%`, backgroundColor: colors.success }]} />
                </View>
              </View>

              {/* Urgency Distribution (Priority cards) */}
              <Text style={styles.groupLabel}>Tugas Aktif per Urgensi</Text>
              <View style={styles.priorityGrid}>
                <View style={[styles.priorityCard, { borderColor: `${colors.danger}25`, backgroundColor: `${colors.danger}06` }]}>
                  <Feather name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.priorityCardVal, { color: colors.danger }]}>{priorityCounts.penting}</Text>
                  <Text style={styles.priorityCardLabel}>Penting</Text>
                </View>
                <View style={[styles.priorityCard, { borderColor: `${colors.warning}25`, backgroundColor: `${colors.warning}06` }]}>
                  <Feather name="minus-circle" size={16} color={colors.warning} />
                  <Text style={[styles.priorityCardVal, { color: colors.warning }]}>{priorityCounts.sedang}</Text>
                  <Text style={styles.priorityCardLabel}>Sedang</Text>
                </View>
                <View style={[styles.priorityCard, { borderColor: `${colors.success}25`, backgroundColor: `${colors.success}06` }]}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.priorityCardVal, { color: colors.success }]}>{priorityCounts.santai}</Text>
                  <Text style={styles.priorityCardLabel}>Santai</Text>
                </View>
              </View>

              {/* Timeliness Analyzer */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Performa Ketepatan Waktu</Text>
                <View style={styles.timelinessRow}>
                  <View style={styles.timeStatItem}>
                    <Text style={[styles.timeStatVal, { color: colors.success }]}>{completedTasks}</Text>
                    <Text style={styles.timeStatLabel}>Sudah Selesai</Text>
                  </View>
                  <View style={styles.timeStatDivider} />
                  <View style={styles.timeStatItem}>
                    <Text style={[styles.timeStatVal, { color: colors.info }]}>{activeOnTimeTasks}</Text>
                    <Text style={styles.timeStatLabel}>Aktif (Tepat Waktu)</Text>
                  </View>
                  <View style={styles.timeStatDivider} />
                  <View style={styles.timeStatItem}>
                    <Text style={[styles.timeStatVal, { color: colors.danger }]}>{overdueTasks}</Text>
                    <Text style={styles.timeStatLabel}>Terlewat (Overdue)</Text>
                  </View>
                </View>
              </View>

              {/* Busiest Categories (Bar Chart) */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Tugas Aktif per Kategori</Text>
                {categoryStats.length === 0 ? (
                  <Text style={styles.emptyText}>Belum ada kategori terdaftar.</Text>
                ) : (
                  categoryStats.map(cat => {
                    const pct = Math.round((cat.activeCount / maxActiveCount) * 100);
                    return (
                      <View key={cat.id} style={styles.catStatRow}>
                        <View style={styles.catStatLabelRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <View style={[styles.catStatDot, { backgroundColor: cat.color }]} />
                            <Text numberOfLines={1} style={styles.catStatName}>{cat.name}</Text>
                          </View>
                          <Text style={styles.catStatCount}>{cat.activeCount} aktif</Text>
                        </View>
                        <View style={styles.catProgressBarBg}>
                          <View 
                            style={[
                              styles.catProgressBarFill, 
                              { 
                                width: `${Math.max(pct, 4)}%`, // minimum width to show visual fill
                                backgroundColor: cat.color 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.bgMain,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    maxHeight: '85%',
  },
  modalContainerDesktop: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressPercentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 60,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  progressPercentText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.success,
  },
  progressSubtext: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressMetricsWrapper: {
    flex: 1,
    paddingLeft: 16,
    gap: 4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  priorityCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityCardVal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  priorityCardLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timelinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeStatVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timeStatLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  timeStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  catStatRow: {
    marginBottom: 12,
  },
  catStatLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catStatName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  catStatCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  catProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  catProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});
