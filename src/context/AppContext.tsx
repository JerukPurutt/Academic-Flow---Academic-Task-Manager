import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../theme';

export interface Task {
  id: string;
  title: string;
  description?: string; // Optional description
  deadline: string | null; // ISO string or null (no deadline)
  category: string;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color code
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface AppContextType {
  tasks: Task[];
  categories: Category[];
  toast: ToastMessage | null;
  isLoading: boolean;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  updateTask: (id: string, updated: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;
  showToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Sample Data for Showcase
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-skripsi', name: 'Skripsi', color: '#ef4444' },
  { id: 'cat-kuliah', name: 'Kuliah', color: '#3b82f6' },
  { id: 'cat-kompetisi', name: 'Kompetisi', color: '#f59e0b' },
  { id: 'cat-pribadi', name: 'Pribadi', color: '#10b981' },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Bimbingan Bab 3 Skripsi',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Skripsi',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Tugas Praktikum Jaringan Komputer',
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Kuliah',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Submit Proposal PKM-KC',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // overdue
    category: 'Kompetisi',
    completed: false,
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [firedAlerts, setFiredAlerts] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Auto-clear Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000); // 4 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load saved data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedTasks, savedCategories, savedFiredAlerts, savedTheme] = await Promise.all([
          AsyncStorage.getItem('academic_tasks_simple'),
          AsyncStorage.getItem('academic_categories_simple'),
          AsyncStorage.getItem('academic_fired_alerts_simple'),
          AsyncStorage.getItem('academic_theme_is_dark'),
        ]);

        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedCategories) setCategories(JSON.parse(savedCategories));
        if (savedFiredAlerts) setFiredAlerts(JSON.parse(savedFiredAlerts));
        if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));
      } catch (e) {
        console.error('Failed to load saved data from storage', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to AsyncStorage whenever state changes (skip if loading)
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('academic_tasks_simple', JSON.stringify(tasks)).catch(console.error);
    }
  }, [tasks, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('academic_categories_simple', JSON.stringify(categories)).catch(console.error);
    }
  }, [categories, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('academic_fired_alerts_simple', JSON.stringify(firedAlerts)).catch(console.error);
    }
  }, [firedAlerts, isLoading]);

  // Background reminder engine (runs every 8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newFiredAlerts = [...firedAlerts];
      let hasNewAlert = false;

      tasks.forEach(task => {
        if (task.completed || !task.deadline) return; // Skip if completed or no deadline

        const deadline = new Date(task.deadline);
        const diffMs = deadline.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        // 1. Check Overdue (tenggat terlewat)
        const overdueKey = `${task.id}-overdue`;
        if (diffMs < 0 && !newFiredAlerts.includes(overdueKey)) {
          newFiredAlerts.push(overdueKey);
          hasNewAlert = true;
          showToast(`Tenggat Lewat: "${task.title}"!`, 'error');
        }

        // 2. Check 15 mins reminder (mendekati tenggat)
        const closeKey = `${task.id}-close-15`;
        if (diffMins > 0 && diffMins <= 15 && !newFiredAlerts.includes(closeKey)) {
          newFiredAlerts.push(closeKey);
          hasNewAlert = true;
          showToast(`Pengingat: "${task.title}" jatuh tempo dalam 15 menit!`, 'warning');
        }
      });

      if (hasNewAlert) {
        setFiredAlerts(newFiredAlerts);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [tasks, firedAlerts]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToast({ id, message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const addTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      completed: false
    };
    setTasks(prev => [newTask, ...prev]);
    showToast(`Tugas "${newTask.title}" berhasil ditambahkan!`, 'success');
  };

  const updateTask = (id: string, updatedFields: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const merged = { ...task, ...updatedFields };
        if (updatedFields.completed && !task.completed) {
          // If task marked as completed, show a success toast
          showToast(`Tugas "${task.title}" selesai dikerjakan.`, 'success');
        }
        return merged;
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (taskToDelete) {
      showToast(`Tugas "${taskToDelete.title}" dihapus.`, 'error');
    }
  };

  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + Math.random().toString(36).substr(2, 9)
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`Kategori "${newCat.name}" berhasil dibuat!`, 'success');
  };

  const updateCategory = (id: string, name: string, color: string) => {
    // Keep reference of old name to update tasks category string if needed
    const oldCategory = categories.find(c => c.id === id);
    
    setCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, name, color } : cat)));
    
    if (oldCategory && oldCategory.name !== name) {
      // Update tasks referencing the category
      setTasks(prev => prev.map(task => {
        if (task.category === oldCategory.name) {
          return { ...task, category: name };
        }
        return task;
      }));
    }
    showToast(`Kategori "${name}" diperbarui.`, 'success');
  };

  const deleteCategory = (id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    if (!catToDelete) return;
    
    setCategories(prev => prev.filter(c => c.id !== id));
    // Move tasks in deleted category to "Pribadi" or default general category
    setTasks(prev => prev.map(task => {
      if (task.category === catToDelete.name) {
        return { ...task, category: 'Pribadi' };
      }
      return task;
    }));
    showToast(`Kategori "${catToDelete.name}" dihapus.`, 'error');
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const newVal = !prev;
      AsyncStorage.setItem('academic_theme_is_dark', JSON.stringify(newVal)).catch(console.error);
      return newVal;
    });
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <AppContext.Provider
      value={{
        tasks,
        categories,
        toast,
        isLoading,
        isDark,
        colors,
        toggleTheme,
        addTask,
        updateTask,
        deleteTask,
        addCategory,
        updateCategory,
        deleteCategory,
        showToast,
        hideToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
