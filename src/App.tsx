import { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, 
  KeyboardAvoidingView, Platform, StatusBar, TouchableWithoutFeedback 
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppProvider, useApp } from './context/AppContext';
import type { Task, Category } from './context/AppContext';
import { Toast } from './components/Toast';
import { ValidationError } from './components/ValidationError';
import { ConfirmModal } from './components/ConfirmModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { theme } from './theme';
import type { ThemeColors } from './theme';

const COLOR_PRESETS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#f59e0b', // Orange
  '#10b981', // Green
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#06b6d4', // Cyan
];

function AppContent() {
  const { 
    tasks, 
    categories, 
    toast, 
    isLoading, 
    addTask, 
    updateTask, 
    deleteTask, 
    addCategory, 
    updateCategory,
    deleteCategory,
    hideToast,
    showToast,
    isDark,
    colors,
    toggleTheme
  } = useApp();

  const styles = getStyles(colors, isDark);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const toggleSearch = () => {
    if (isSearchVisible) {
      setSearchTerm('');
    }
    setIsSearchVisible(!isSearchVisible);
  };

  // Task Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [hasDeadline, setHasDeadline] = useState(true);
  const [deadline, setDeadline] = useState<Date>(new Date(Date.now() + 24 * 3600 * 1000));
  
  // Category management modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catColorInput, setCatColorInput] = useState('#6366f1');

  // Custom Confirm Modal configuration
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; action: () => void } | null>(null);

  // Task Detail state
  const [selectedTaskIdForDetail, setSelectedTaskIdForDetail] = useState<string | null>(null);
  const selectedTaskForDetail = tasks.find(t => t.id === selectedTaskIdForDetail) || null;

  // Inline validation errors
  const [titleError, setTitleError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Date/Time picker helper state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Task Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory(categories[0]?.name || 'Pribadi');
    setHasDeadline(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    setDeadline(tomorrow);
    setTitleError('');
    setCategoryError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    if (task.deadline) {
      setHasDeadline(true);
      setDeadline(new Date(task.deadline));
    } else {
      setHasDeadline(false);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setDeadline(tomorrow);
    }
    setTitleError('');
    setCategoryError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Category Manager Methods
  const handleOpenCategoryModal = () => {
    setEditingCategory(null);
    setCatNameInput('');
    setCatColorInput('#6366f1');
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleEditCategoryStart = (cat: Category) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setCatColorInput(cat.color);
    setCategoryError('');
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCatNameInput('');
    setCatColorInput('#6366f1');
    setCategoryError('');
  };

  const handleSaveCategory = () => {
    const trimmed = catNameInput.trim();
    if (!trimmed) {
      setCategoryError('Nama kategori wajib diisi!');
      return;
    }
    
    const duplicate = categories.some(
      c => c.name.toLowerCase() === trimmed.toLowerCase() && (!editingCategory || c.id !== editingCategory.id)
    );
    if (duplicate) {
      setCategoryError('Kategori ini sudah terdaftar.');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, trimmed, catColorInput);
      if (category === editingCategory.name) {
        setCategory(trimmed);
      }
      setEditingCategory(null);
    } else {
      addCategory({ name: trimmed, color: catColorInput });
      setCategory(trimmed);
    }
    
    setCatNameInput('');
    setCategoryError('');
  };

  const handleSubmit = () => {
    let hasError = false;
    if (!title.trim()) {
      setTitleError('Judul tugas wajib diisi!');
      hasError = true;
    } else {
      setTitleError('');
    }

    if (!category) {
      setCategoryError('Pilih salah satu kategori!');
      hasError = true;
    } else {
      setCategoryError('');
    }

    if (hasDeadline && isNaN(deadline.getTime())) {
      showToast('Format tanggal/waktu tidak valid.', 'error');
      hasError = true;
    }

    if (hasError) return;

    const taskPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: hasDeadline ? deadline.toISOString() : null,
      category: category,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskPayload);
    } else {
      addTask(taskPayload);
    }
    handleCloseModal();
  };

  const onDatePickerChange = (event: any, selectedValue?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    if (selectedValue) {
      if (pickerMode === 'date') {
        const newDate = new Date(deadline);
        newDate.setFullYear(selectedValue.getFullYear(), selectedValue.getMonth(), selectedValue.getDate());
        setDeadline(newDate);
        setPickerMode('time');
        setTimeout(() => setShowDatePicker(true), 150);
      } else {
        const newDate = new Date(deadline);
        newDate.setHours(selectedValue.getHours(), selectedValue.getMinutes());
        setDeadline(newDate);
        setShowDatePicker(false);
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const openPicker = () => {
    setPickerMode('date');
    setShowDatePicker(true);
  };

  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : colors.primary;
  };

  const getFormattedDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      {/* HEADER */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Academic Flow</Text>
            <Text style={styles.headerSubtitle}>{getFormattedDate()}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={toggleSearch} 
              style={[
                styles.headerSearchButton,
                isSearchVisible && styles.headerSearchButtonActive
              ]}
              activeOpacity={0.8}
            >
              <Feather name="search" size={16} color={isSearchVisible ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>

            {/* THEME TOGGLE BUTTON */}
            <TouchableOpacity 
              onPress={toggleTheme} 
              style={styles.headerThemeButton}
              activeOpacity={0.8}
            >
              <Feather 
                name={isDark ? "sun" : "moon"} 
                size={16} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>

            {/* STATS CAPSULE */}
            <View style={styles.statsCapsule}>
              <View style={styles.statsSegment}>
                <Feather name="clock" size={11} color={colors.primary} />
                <Text style={styles.statsNumber}>{activeTasks}</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsSegment}>
                <Feather name="check-circle" size={11} color={colors.success} />
                <Text style={[styles.statsNumber, { color: colors.success }]}>{completedTasks}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* SEARCH BAR & FILTERS */}
      <View style={styles.searchBarContainer}>
        {isSearchVisible && (
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Feather name="search" size={15} color={theme.colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari tugas..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoFocus={true}
              />
            </View>
          </View>
        )}

        {/* Category Filter Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterRow}>
          <TouchableOpacity 
            onPress={() => setSelectedCategory('all')} 
            style={[styles.filterPill, selectedCategory === 'all' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, selectedCategory === 'all' && styles.filterPillTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => setSelectedCategory(cat.name)} 
              style={[
                styles.filterPill, 
                selectedCategory === cat.name && { backgroundColor: cat.color }
              ]}
            >
              <Text style={[
                styles.filterPillText, 
                selectedCategory === cat.name && styles.filterPillTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TASK LIST */}
      <ScrollView style={styles.taskList} contentContainerStyle={styles.taskListContent} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.infoText}>Memuat tugas...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={36} color={theme.colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Tidak ada tugas</Text>
            <Text style={styles.emptySubtitle}>Buat pengingat tugas pertamamu sekarang.</Text>
          </View>
        ) : (
          filteredTasks.map(task => {
            const catColor = getCategoryColor(task.category);
            const isOverdue = task.deadline 
              ? new Date(task.deadline).getTime() < Date.now() && !task.completed
              : false;
            const formattedDate = task.deadline 
              ? new Date(task.deadline).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '';

            return (
              <View 
                key={task.id} 
                style={[
                  styles.taskCard, 
                  { 
                    backgroundColor: `${catColor}12`, // Subtle category tint
                    borderColor: `${catColor}25` // Match border to tint
                  },
                  task.completed && styles.taskCardCompleted
                ]}
              >
                {/* Complete Toggle Checkbox */}
                <TouchableOpacity 
                  onPress={() => updateTask(task.id, { completed: !task.completed })}
                  style={styles.checkboxWrapper}
                >
                  <View style={[
                    styles.checkbox,
                    task.completed && { backgroundColor: colors.success, borderColor: colors.success }
                  ]}>
                    {task.completed && <Feather name="check" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>

                {/* Content */}
                <TouchableOpacity 
                  style={styles.cardContent}
                  onPress={() => setSelectedTaskIdForDetail(task.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.taskCardTitle,
                    task.completed && styles.taskCardTitleCompleted
                  ]}>
                    {task.title}
                  </Text>
                  
                  {task.description ? (
                    <Text 
                      style={[
                        styles.taskCardDesc,
                        task.completed && styles.taskCardDescCompleted
                      ]}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  ) : null}
                  
                  <View style={styles.cardFooter}>
                    {/* Category tag */}
                    <View style={[styles.catTag, { backgroundColor: `${catColor}15` }]}>
                      <Text style={[styles.catTagText, { color: catColor }]}>{task.category}</Text>
                    </View>

                    {/* Deadline Reminder */}
                    <View style={styles.timeWrapper}>
                      <Feather 
                        name={task.deadline ? "clock" : "bell-off"} 
                        size={12} 
                        color={isOverdue ? colors.danger : colors.textMuted} 
                      />
                      <Text style={[
                        styles.timeText,
                        isOverdue && styles.timeTextOverdue
                      ]}>
                        {task.deadline ? formattedDate : 'Tanpa Tenggat'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Actions */}
                <View style={styles.actionsWrapper}>
                  {!task.completed && (
                    <TouchableOpacity onPress={() => handleOpenEditModal(task)} style={styles.actionIconButton}>
                      <Feather name="edit-2" size={13} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={() => {
                      setConfirmConfig({
                        title: 'Hapus Pengingat?',
                        message: `Apakah Anda yakin ingin menghapus tugas "${task.title}"? Tindakan ini tidak dapat dibatalkan.`,
                        action: () => {
                          deleteTask(task.id);
                          setConfirmConfig(null);
                        }
                      });
                    }} 
                    style={[styles.actionIconButton, { marginLeft: 6 }]}
                  >
                    <Feather name="trash-2" size={13} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON (FAB) FOR ADDING TASK */}
      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={handleOpenCreateModal}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* QUICK ADD MODAL */}
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <KeyboardAvoidingView
            behavior="padding"
            style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Feather name={editingTask ? "edit-2" : "plus"} size={16} color={theme.colors.textPrimary} />
                <Text style={styles.modalTitle}>
                  {editingTask ? 'Edit Pengingat' : 'Tambah Pengingat'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                <Feather name="x" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Task Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Judul Tugas / Pengingat *</Text>
                <TextInput
                  style={[
                    styles.textInput, 
                    titleError ? { borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.04)' } : {}
                  ]}
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    if (val.trim()) setTitleError('');
                  }}
                  placeholder="Contoh: Kuis Matematika Bab 4..."
                  placeholderTextColor={colors.textMuted}
                  autoFocus={true}
                />
                <ValidationError message={titleError} />
              </View>

              {/* Task Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deskripsi (Opsional)</Text>
                <TextInput
                  style={styles.textAreaInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Contoh: Tulis detail tugas atau catatan di sini..."
                  placeholderTextColor={colors.textMuted}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Category selector */}
              <View style={styles.formGroup}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.formLabel}>Kategori *</Text>
                  <TouchableOpacity 
                    onPress={handleOpenCategoryModal} 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Feather name="settings" size={11} color={colors.primary} />
                    <Text style={styles.addCategoryLink}>Kelola Kategori</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.categoryPillRow}>
                  {categories.map(cat => {
                    const isSelected = category === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          setCategory(cat.name);
                          setCategoryError('');
                        }}
                        style={[
                          styles.catSelectPill,
                          isSelected && { backgroundColor: cat.color, borderColor: cat.color }
                        ]}
                      >
                        <Text style={[
                          styles.catSelectPillText,
                          isSelected && styles.catSelectPillTextActive
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <ValidationError message={categoryError} />
              </View>

              {/* Toggle Has Deadline */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Aktifkan Tenggat / Pengingat</Text>
                <TouchableOpacity 
                  onPress={() => setHasDeadline(!hasDeadline)} 
                  style={[
                    styles.toggleSwitch,
                    hasDeadline && styles.toggleSwitchActive
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.toggleKnob,
                    hasDeadline && styles.toggleKnobActive
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Date/Time Picker Trigger */}
              {hasDeadline && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Waktu Pengingat *</Text>
                  <TouchableOpacity style={styles.pickerTriggerButton} onPress={openPicker}>
                    <Feather name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={styles.pickerTriggerText}>
                      {deadline.toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={styles.modalSaveBtn}>
                <Feather name="save" size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.modalSaveBtnText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
       </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>

      {/* CATEGORY MANAGEMENT MODAL */}
      <Modal
        visible={isCategoryModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsCategoryModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCategoryModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior="padding"
            style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Feather name="settings" size={16} color={theme.colors.textPrimary} />
                <Text style={styles.modalTitle}>Kelola Kategori</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCategoryModalOpen(false)} style={styles.modalCloseButton}>
                <Feather name="x" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.catFormGroup}>
              <Text style={styles.formLabel}>
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  style={[
                    styles.textInput, 
                    { flex: 1, height: 38 },
                    categoryError ? { borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.04)' } : {}
                  ]}
                  placeholder="Nama kategori..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={catNameInput}
                  onChangeText={(val) => {
                    setCatNameInput(val);
                    if (val.trim()) setCategoryError('');
                  }}
                />
                
                <TouchableOpacity style={styles.catFormSaveBtn} onPress={handleSaveCategory}>
                  <Text style={styles.catFormSaveText}>
                    {editingCategory ? 'Update' : 'Tambah'}
                  </Text>
                </TouchableOpacity>
                
                {editingCategory && (
                  <TouchableOpacity style={styles.catFormCancelBtn} onPress={handleCancelCategoryEdit}>
                    <Text style={styles.catFormCancelText}>Batal</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <ValidationError message={categoryError} />
              
              {/* Preset Colors */}
              <View style={{ marginTop: 6 }}>
                <Text style={[styles.formLabel, { fontSize: 9, marginBottom: 4 }]}>Pilih Warna Preset</Text>
                <View style={styles.colorPresetsRow}>
                  {COLOR_PRESETS.map(color => {
                    const isSelected = catColorInput === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setCatColorInput(color)}
                        style={[
                          styles.colorPresetCircle,
                          { backgroundColor: color },
                          isSelected && styles.colorPresetCircleSelected
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            </View>

            {/* List */}
            <Text style={[styles.formLabel, { marginTop: 10, marginBottom: 8 }]}>Daftar Kategori Terdaftar</Text>
            <ScrollView style={styles.categoryManageList} keyboardShouldPersistTaps="handled">
              {categories.map(cat => (
                <View key={cat.id} style={styles.catManageRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={[styles.catColorIndicator, { backgroundColor: cat.color }]} />
                    <Text style={styles.catManageName}>{cat.name}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleEditCategoryStart(cat)} style={styles.catManageActionBtn}>
                      <Feather name="edit-2" size={12} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {cat.name !== 'Pribadi' && (
                      <TouchableOpacity 
                        onPress={() => {
                          setConfirmConfig({
                            title: 'Hapus Kategori?',
                            message: `Hapus kategori "${cat.name}"? Tugas-tugas dengan kategori ini akan dialihkan ke kategori "Pribadi".`,
                            action: () => {
                              deleteCategory(cat.id);
                              setConfirmConfig(null);
                            }
                          });
                        }} 
                        style={styles.catManageActionBtn}
                      >
                        <Feather name="trash-2" size={12} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
            </View>
          </TouchableWithoutFeedback>
         </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Date/Time Picker Component */}
      {showDatePicker && (
        <DateTimePicker
          value={deadline}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={onDatePickerChange}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={selectedTaskIdForDetail !== null}
        task={selectedTaskForDetail}
        categories={categories}
        colors={colors}
        isDark={isDark}
        onClose={() => setSelectedTaskIdForDetail(null)}
        onEdit={(task) => {
          setSelectedTaskIdForDetail(null);
          handleOpenEditModal(task);
        }}
        onDelete={(task) => {
          setSelectedTaskIdForDetail(null);
          setConfirmConfig({
            title: 'Hapus Pengingat?',
            message: `Apakah Anda yakin ingin menghapus tugas "${task.title}"? Tindakan ini tidak dapat dibatalkan.`,
            action: () => {
              deleteTask(task.id);
              setConfirmConfig(null);
            }
          });
        }}
        onToggleComplete={(task) => {
          updateTask(task.id, { completed: !task.completed });
        }}
      />

      {/* Confirm Action Modal */}
      <ConfirmModal
        visible={confirmConfig !== null}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        onCancel={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.action || (() => {})}
        colors={colors}
      />

      {/* Toast Overlay */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          colors={colors}
          isDark={isDark}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  headerContainer: {
    backgroundColor: colors.bgMain,
  },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.bgMain,
  },
  headerLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSearchButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSearchButtonActive: {
    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.12)',
    borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.25)',
  },
  headerThemeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statsSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statsDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  searchBarContainer: {
    padding: 16,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(15, 23, 42, 0.01)',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(18, 18, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },
  categoryFilterRow: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 90, // Increased padding to prevent FAB overlay
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  taskCardCompleted: {
    opacity: 0.4,
  },
  checkboxWrapper: {
    paddingRight: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  taskCardTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  taskCardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  taskCardDescCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catTagText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  timeTextOverdue: {
    color: colors.danger,
    fontWeight: '600',
  },
  actionsWrapper: {
    flexDirection: 'row',
    paddingLeft: 10,
  },
  actionIconButton: {
    padding: 6,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.bgMain,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 14,
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
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13.5,
  },
  textAreaInput: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 80,
    fontSize: 13.5,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addCategoryLink: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: 'bold',
  },
  categoryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(15, 23, 42, 0.01)',
  },
  catSelectPillText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  catSelectPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  pickerTriggerText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: colors.success,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  catFormGroup: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  catFormSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catFormSaveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  catFormCancelBtn: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catFormCancelText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  colorPresetsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  colorPresetCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  colorPresetCircleSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },
  categoryManageList: {
    maxHeight: 180,
  },
  catManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catColorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catManageName: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '500',
  },
  catManageActionBtn: {
    padding: 6,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
