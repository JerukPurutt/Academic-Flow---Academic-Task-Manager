import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  useWindowDimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Task, Category } from '../context/AppContext';
import type { ThemeColors } from '../theme';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  categories: Category[];
  colors: ThemeColors;
  isDark: boolean;
  onSelectTask: (taskId: string) => void;
  onToggleCompleteTask: (taskId: string, completed: boolean) => void;
  onAddTaskForDate: (date: Date) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  tasks,
  categories,
  colors,
  isDark,
  onSelectTask,
  onToggleCompleteTask,
  onAddTaskForDate,
}) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 800;
  const styles = getStyles(colors, isDark);

  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Reset selected date and view date to current time when modal opens
  useEffect(() => {
    if (visible) {
      setViewDate(new Date());
      setSelectedDate(new Date());
    }
  }, [visible]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(now);
  };

  // Generate calendar grid (42 days: 6 rows of 7 columns)
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();

  const gridDays = [];

  // Add padding days from the previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cellMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const cellYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    gridDays.push({
      day: dayNum,
      month: cellMonth,
      year: cellYear,
      isCurrentMonth: false,
    });
  }

  // Add days of the current month
  for (let i = 1; i <= totalDays; i++) {
    gridDays.push({
      day: i,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Add padding days from the next month
  const remaining = 42 - gridDays.length;
  for (let i = 1; i <= remaining; i++) {
    const cellMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const cellYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    gridDays.push({
      day: i,
      month: cellMonth,
      year: cellYear,
      isCurrentMonth: false,
    });
  }

  // Get tasks due on a specific cell's date
  const getTasksForDate = (cellYear: number, cellMonth: number, cellDay: number) => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const tDate = new Date(task.deadline);
      return (
        tDate.getFullYear() === cellYear &&
        tDate.getMonth() === cellMonth &&
        tDate.getDate() === cellDay
      );
    });
  };

  // Category Color mapping helper
  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : colors.primary;
  };

  // Selected date tasks
  const selectedDateTasks = getTasksForDate(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, isLargeScreen && styles.modalOverlayDesktop]}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={isLargeScreen ? styles.keyboardAvoidDesktop : styles.keyboardAvoidMobile}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, isLargeScreen && styles.modalContainerDesktop]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <Feather name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.modalTitle}>Kalender Tugas</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Feather name="x" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Modal Body wrapper to manage responsive layout */}
              <View style={[styles.modalContentBody, isLargeScreen && styles.modalContentBodyDesktop]}>
                
                {/* LEFT SIDE: CALENDAR GRID */}
                <View style={[styles.calendarSide, isLargeScreen && styles.calendarSideDesktop]}>
                  {/* Calendar Navigation */}
                  <View style={styles.navigationRow}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton} activeOpacity={0.7}>
                      <Feather name="chevron-left" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleGoToToday} style={styles.monthLabelContainer} activeOpacity={0.7}>
                      <Text style={styles.monthLabel}>
                        {MONTH_NAMES[viewMonth]} {viewYear}
                      </Text>
                      {/* Show tiny back-to-today button if view month is different from current month */}
                      {(viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) && (
                        <View style={styles.todayIndicatorPill}>
                          <Text style={styles.todayIndicatorPillText}>Hari Ini</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNextMonth} style={styles.navButton} activeOpacity={0.7}>
                      <Feather name="chevron-right" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Day Names Row */}
                  <View style={styles.dayNamesRow}>
                    {DAY_NAMES.map((name, index) => (
                      <Text 
                        key={name} 
                        style={[
                          styles.dayNameText, 
                          index === 0 && { color: colors.danger } // Highlight Sunday
                        ]}
                      >
                        {name}
                      </Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGrid}>
                    {gridDays.map((cell, index) => {
                      const cellTasks = getTasksForDate(cell.year, cell.month, cell.day);
                      const activeCellTasks = cellTasks.filter(t => !t.completed);
                      const isCellToday = 
                        today.getDate() === cell.day && 
                        today.getMonth() === cell.month && 
                        today.getFullYear() === cell.year;
                      const isCellSelected = 
                        selectedDate.getDate() === cell.day && 
                        selectedDate.getMonth() === cell.month && 
                        selectedDate.getFullYear() === cell.year;

                      return (
                        <TouchableOpacity
                          key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
                          style={[
                            styles.gridCell,
                            !cell.isCurrentMonth && styles.gridCellOutside,
                            isCellSelected && styles.gridCellSelected,
                            isCellToday && !isCellSelected && styles.gridCellToday,
                          ]}
                          activeOpacity={0.75}
                          onPress={() => {
                            setSelectedDate(new Date(cell.year, cell.month, cell.day));
                            // Also shift view date if user clicks outside padding days
                            if (!cell.isCurrentMonth) {
                              setViewDate(new Date(cell.year, cell.month, 1));
                            }
                          }}
                        >
                          <Text 
                            style={[
                              styles.gridCellText,
                              !cell.isCurrentMonth && styles.gridCellTextOutside,
                              isCellSelected && styles.gridCellTextSelected,
                              isCellToday && !isCellSelected && { color: colors.primary, fontWeight: 'bold' }
                            ]}
                          >
                            {cell.day}
                          </Text>

                          {/* Task Dots */}
                          <View style={styles.dotsRow}>
                            {cellTasks.slice(0, 3).map((task, idx) => {
                              const color = getCategoryColor(task.category);
                              return (
                                <View 
                                  key={task.id} 
                                  style={[
                                    styles.taskDot, 
                                    { backgroundColor: color },
                                    task.completed && styles.taskDotCompleted
                                  ]} 
                                />
                              );
                            })}
                            {cellTasks.length > 3 && (
                              <View style={[styles.taskDotMore, { backgroundColor: colors.textMuted }]}>
                                <Text style={styles.taskDotMoreText}>+</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* RIGHT SIDE: SELECTED DATE'S TASK LIST */}
                <View style={[styles.tasksSide, isLargeScreen && styles.tasksSideDesktop]}>
                  <View style={styles.tasksHeader}>
                    <Text style={styles.tasksSectionLabel}>
                      Tugas • {selectedDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    <TouchableOpacity 
                      style={styles.inlineAddBtn}
                      onPress={() => onAddTaskForDate(selectedDate)}
                      activeOpacity={0.7}
                    >
                      <Feather name="plus" size={12} color={colors.primary} />
                      <Text style={styles.inlineAddBtnText}>Tambah</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    style={styles.tasksScrollList}
                    contentContainerStyle={styles.tasksScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {selectedDateTasks.length === 0 ? (
                      <View style={styles.emptyTasksContainer}>
                        <Feather name="smile" size={24} color={colors.textMuted} style={{ marginBottom: 6 }} />
                        <Text style={styles.emptyTasksText}>Tidak ada tugas untuk tanggal ini.</Text>
                        <TouchableOpacity 
                          style={styles.emptyAddBtn}
                          onPress={() => onAddTaskForDate(selectedDate)}
                          activeOpacity={0.8}
                        >
                          <Feather name="plus" size={13} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.emptyAddBtnText}>Buat Tugas Baru</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      selectedDateTasks.map(task => {
                        const catColor = getCategoryColor(task.category);
                        const deadlineTime = task.deadline 
                          ? new Date(task.deadline).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }).replace('.', ':')
                          : '';

                        return (
                          <View 
                            key={task.id} 
                            style={[
                              styles.miniTaskCard,
                              { backgroundColor: `${catColor}08`, borderColor: `${catColor}20` },
                              task.completed && styles.miniTaskCardCompleted
                            ]}
                          >
                            {/* Checkbox */}
                            <TouchableOpacity 
                              onPress={() => onToggleCompleteTask(task.id, !task.completed)}
                              style={styles.miniCheckbox}
                              activeOpacity={0.7}
                            >
                              <View style={[
                                styles.checkboxCircle,
                                task.completed && { backgroundColor: colors.success, borderColor: colors.success }
                              ]}>
                                {task.completed && <Feather name="check" size={10} color="#fff" />}
                              </View>
                            </TouchableOpacity>

                            {/* Task Content */}
                            <TouchableOpacity 
                              style={styles.miniCardContent} 
                              onPress={() => onSelectTask(task.id)}
                              activeOpacity={0.7}
                            >
                              <Text 
                                numberOfLines={1} 
                                style={[
                                  styles.miniTaskTitle,
                                  task.completed && styles.miniTaskTitleCompleted
                                ]}
                              >
                                {task.title}
                              </Text>
                              
                              <View style={styles.miniCardFooter}>
                                <View style={[styles.miniCatBadge, { backgroundColor: `${catColor}15` }]}>
                                  <Text style={[styles.miniCatBadgeText, { color: catColor }]}>{task.category}</Text>
                                </View>
                                {task.deadline && (
                                  <View style={styles.miniTimeRow}>
                                    <Feather name="clock" size={10} color={colors.textMuted} />
                                    <Text style={styles.miniTimeText}>{deadlineTime}</Text>
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
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
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardAvoidMobile: {
    width: '100%',
    justifyContent: 'flex-end',
    flex: 1,
  },
  keyboardAvoidDesktop: {
    width: '100%',
    maxWidth: 760,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.bgMain,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    maxHeight: '90%',
  },
  modalContainerDesktop: {
    width: '100%',
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalContentBody: {
    flexDirection: 'column',
    gap: 16,
  },
  modalContentBodyDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    minHeight: 380,
  },
  calendarSide: {
    flex: 1,
    width: '100%',
  },
  calendarSideDesktop: {
    maxWidth: 380,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  todayIndicatorPill: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: `${colors.primary}30`,
  },
  todayIndicatorPillText: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: 'bold',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '14.28%', // 7 columns
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderRadius: 8,
    marginVertical: 1,
    paddingTop: 4,
    paddingBottom: 2,
    position: 'relative',
  },
  gridCellOutside: {
    opacity: 0.35,
  },
  gridCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gridCellToday: {
    backgroundColor: `${colors.primary}12`,
    borderColor: `${colors.primary}35`,
    borderWidth: 1,
  },
  gridCellText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  gridCellTextOutside: {
    color: colors.textMuted,
  },
  gridCellTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2.5,
    marginTop: 4,
    justifyContent: 'center',
    height: 4,
    width: '100%',
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  taskDotCompleted: {
    opacity: 0.35,
  },
  taskDotMore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskDotMoreText: {
    fontSize: 5,
    color: '#fff',
    lineHeight: 5,
    fontWeight: 'bold',
  },
  tasksSide: {
    flex: 1,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  tasksSideDesktop: {
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingTop: 0,
    paddingLeft: 18,
    height: 380,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tasksSectionLabel: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  inlineAddBtnText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: colors.primary,
  },
  tasksScrollList: {
    flex: 1,
  },
  tasksScrollContent: {
    gap: 8,
    paddingBottom: 10,
  },
  emptyTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    opacity: 0.8,
  },
  emptyTasksText: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyAddBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  miniTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  miniTaskCardCompleted: {
    opacity: 0.6,
  },
  miniCheckbox: {
    marginRight: 8,
  },
  checkboxCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCardContent: {
    flex: 1,
  },
  miniTaskTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  miniTaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  miniCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  miniCatBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  miniTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniTimeText: {
    fontSize: 9.5,
    color: colors.textMuted,
  },
});
