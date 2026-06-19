import React from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Task, Category } from '../context/AppContext';
import type { ThemeColors } from '../theme';

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  categories: Category[];
  colors: ThemeColors;
  isDark: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  categories,
  colors,
  isDark,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  if (!task) return null;

  const styles = getStyles(colors, isDark);

  // Find category color
  const cat = categories.find(c => c.name === task.category);
  const catColor = cat ? cat.color : colors.primary;

  // Check if overdue
  const isOverdue = task.deadline 
    ? new Date(task.deadline).getTime() < Date.now() && !task.completed
    : false;

  // Format date
  const getFormattedDeadline = (deadlineStr: string | null) => {
    if (!deadlineStr) return 'Tanpa Tenggat';
    const date = new Date(deadlineStr);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status details
  const getStatusBadge = () => {
    if (task.completed) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}>
          <Feather name="check-circle" size={12} color={colors.success} />
          <Text style={[styles.statusBadgeText, { color: colors.success }]}>Selesai</Text>
        </View>
      );
    }
    if (isOverdue) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}30` }]}>
          <Feather name="alert-triangle" size={12} color={colors.danger} />
          <Text style={[styles.statusBadgeText, { color: colors.danger }]}>Terlewat</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
        <Feather name="clock" size={12} color={colors.primary} />
        <Text style={[styles.statusBadgeText, { color: colors.primary }]}>Aktif</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
          {/* Header Row */}
          <View style={styles.modalHeader}>
            <View style={styles.headerBadgeRow}>
              {getStatusBadge()}
              <View style={[styles.catBadge, { backgroundColor: `${catColor}15` }]}>
                <Text style={[styles.catBadgeText, { color: catColor }]}>{task.category}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted
            ]}>
              {task.title}
            </Text>

            {/* Deadline Row */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionLabel}>Tenggat Waktu</Text>
              <View style={[
                styles.infoCard,
                isOverdue && { borderColor: `${colors.danger}30`, backgroundColor: `${colors.danger}05` }
              ]}>
                <Feather 
                  name={task.deadline ? "calendar" : "bell-off"} 
                  size={16} 
                  color={isOverdue ? colors.danger : colors.textSecondary} 
                />
                <Text style={[
                  styles.infoCardText,
                  isOverdue && styles.infoCardTextOverdue
                ]}>
                  {getFormattedDeadline(task.deadline)}
                </Text>
              </View>
            </View>

            {/* Description Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionLabel}>Deskripsi Tugas</Text>
              {task.description ? (
                <View style={styles.descCard}>
                  <ScrollView style={styles.descScrollView} nestedScrollEnabled={true}>
                    <Text style={styles.descText}>{task.description}</Text>
                  </ScrollView>
                </View>
              ) : (
                <View style={[styles.descCard, styles.emptyDescCard]}>
                  <Text style={styles.emptyDescText}>Tidak ada deskripsi untuk tugas ini.</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.modalFooter}>
            {/* Toggle Completion */}
            <TouchableOpacity 
              style={[
                styles.toggleCompleteBtn,
                task.completed ? styles.btnOutline : { backgroundColor: colors.success }
              ]} 
              onPress={() => onToggleComplete(task)}
              activeOpacity={0.85}
            >
              <Feather 
                name={task.completed ? "rotate-ccw" : "check"} 
                size={15} 
                color={task.completed ? colors.textPrimary : "#fff"} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[
                styles.btnText,
                task.completed ? { color: colors.textPrimary } : { color: '#fff' }
              ]}>
                {task.completed ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
              </Text>
            </TouchableOpacity>

            {/* Edit and Delete Grid */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.editBtn]} 
                onPress={() => onEdit(task)}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.btnText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]} 
                onPress={() => onDelete(task)}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={14} color={colors.danger} style={{ marginRight: 6 }} />
                <Text style={[styles.btnText, { color: colors.danger }]}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  modalContainer: {
    backgroundColor: colors.bgMain,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    maxHeight: '85%',
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
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoCardText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  infoCardTextOverdue: {
    color: colors.danger,
    fontWeight: '600',
  },
  descCard: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  descScrollView: {
    maxHeight: 180,
  },
  descText: {
    color: colors.textPrimary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  emptyDescCard: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  emptyDescText: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontStyle: 'italic',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    gap: 10,
  },
  toggleCompleteBtn: {
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: 'transparent',
    borderColor: `${colors.primary}30`,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderColor: `${colors.danger}30`,
  },
  btnText: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
});
