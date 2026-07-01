import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { darkColors, lightColors, ThemeColors } from '../theme';

export type TaskPriority = 'santai' | 'sedang' | 'penting';

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string | null;
  category: string;
  completed: boolean;
  priority: TaskPriority;
}

export interface Category {
  id: string;
  name: string;
  color: string;
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
  syncStatus: 'online' | 'offline' | 'connecting';
  toggleTheme: () => void;
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  updateTask: (id: string, updated: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;
  showToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  hideToast: () => void;
  triggerManualSync: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to determine the backend API URL dynamically based on Platform & Environment
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:3000`;
  }
  
  // Expo Go App running on physical device
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  
  // Fallbacks
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const BACKEND_URL = getBackendUrl();

// Helper to migrate legacy priorities
const migratePriority = (priority: any): TaskPriority => {
  if (priority === 'tinggi') return 'penting';
  if (priority === 'rendah') return 'santai';
  if (priority === 'penting' || priority === 'sedang' || priority === 'santai') return priority;
  return 'sedang';
};

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
    priority: 'penting',
  },
  {
    id: 'task-2',
    title: 'Tugas Praktikum Jaringan Komputer',
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Kuliah',
    completed: false,
    priority: 'sedang',
  },
  {
    id: 'task-3',
    title: 'Submit Proposal PKM-KC',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Kompetisi',
    completed: false,
    priority: 'penting',
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  
  // Core states
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [firedAlerts, setFiredAlerts] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync related states
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [localLastUpdated, setLocalLastUpdated] = useState<number>(0);

  // Use refs to access latest values in intervals without recreating them
  const stateRef = useRef({ tasks, categories, lastSyncTime, localLastUpdated, syncStatus });
  
  useEffect(() => {
    stateRef.current = { tasks, categories, lastSyncTime, localLastUpdated, syncStatus };
  }, [tasks, categories, lastSyncTime, localLastUpdated, syncStatus]);

  // Auto-clear Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load saved data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          savedTasks, 
          savedCategories, 
          savedFiredAlerts, 
          savedTheme,
          savedLastSync,
          savedLocalUpdated
        ] = await Promise.all([
          AsyncStorage.getItem('academic_tasks_simple'),
          AsyncStorage.getItem('academic_categories_simple'),
          AsyncStorage.getItem('academic_fired_alerts_simple'),
          AsyncStorage.getItem('academic_theme_is_dark'),
          AsyncStorage.getItem('academic_last_sync_time'),
          AsyncStorage.getItem('academic_local_last_updated'),
        ]);

        if (savedTasks) {
          const parsed = JSON.parse(savedTasks);
          const migrated = parsed.map((t: any) => ({ ...t, priority: migratePriority(t.priority) }));
          setTasks(migrated);
        } else {
          // If no tasks saved, ensure initial tasks have migrated priority
          setTasks(INITIAL_TASKS);
        }

        if (savedCategories) setCategories(JSON.parse(savedCategories));
        if (savedFiredAlerts) setFiredAlerts(JSON.parse(savedFiredAlerts));
        if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));
        if (savedLastSync) setLastSyncTime(Number(savedLastSync));
        if (savedLocalUpdated) setLocalLastUpdated(Number(savedLocalUpdated));

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

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('academic_last_sync_time', String(lastSyncTime)).catch(console.error);
    }
  }, [lastSyncTime, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('academic_local_last_updated', String(localLastUpdated)).catch(console.error);
    }
  }, [localLastUpdated, isLoading]);

  // Network Sync functions
  const fetchFromServer = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sync`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error('Server returned non-ok status');
      
      const data = await response.json();
      const serverLastUpdated = data.lastUpdated || 0;
      
      // If server has newer data than our last sync time, pull it
      if (serverLastUpdated > stateRef.current.lastSyncTime) {
        const migratedTasks = (data.tasks || []).map((t: any) => ({
          ...t,
          priority: migratePriority(t.priority)
        }));
        
        setTasks(migratedTasks);
        setCategories(data.categories || []);
        setLastSyncTime(serverLastUpdated);
        // Sync our local updated timestamp to match so we are aligned
        setLocalLastUpdated(serverLastUpdated);
      }
      setSyncStatus('online');
    } catch (error) {
      console.log('Fetch from server failed:', error.message);
      setSyncStatus('offline');
    }
  };

  const pushToServer = async (tasksToPush: Task[], categoriesToPush: Category[]) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: tasksToPush,
          categories: categoriesToPush
        })
      });
      if (!response.ok) throw new Error('Server returned non-ok status');
      
      const data = await response.json();
      setLastSyncTime(data.lastUpdated);
      setLocalLastUpdated(data.lastUpdated);
      setSyncStatus('online');
    } catch (error) {
      console.log('Push to server failed:', error.message);
      setSyncStatus('offline');
    }
  };

  // Perform a full check of sync status and resolve data conflicts
  const performSync = async () => {
    const { tasks: currTasks, categories: currCats, localLastUpdated: localUpd, lastSyncTime: lastSync, syncStatus: currStatus } = stateRef.current;
    
    try {
      // Quick check if server is reachable
      const statusRes = await fetch(`${BACKEND_URL}/api/status`, { signal: AbortSignal.timeout(2000) });
      if (!statusRes.ok) throw new Error('Status ping unsuccessful');
      
      // If server is reachable and we have local modifications not pushed yet
      if (localUpd > lastSync) {
        await pushToServer(currTasks, currCats);
      } else {
        // Otherwise, fetch latest changes from server
        await fetchFromServer();
      }
      setSyncStatus('online');
    } catch (error) {
      if (currStatus !== 'offline') {
        setSyncStatus('offline');
      }
    }
  };

  // Poll sync server every 5 seconds
  useEffect(() => {
    if (isLoading) return;
    
    // Initial sync
    performSync();

    const interval = setInterval(() => {
      performSync();
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Background reminder engine (runs every 8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newFiredAlerts = [...firedAlerts];
      let hasNewAlert = false;

      tasks.forEach(task => {
        if (task.completed || !task.deadline) return;

        const deadline = new Date(task.deadline);
        const diffMs = deadline.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        // 1. Check Overdue
        const overdueKey = `${task.id}-overdue`;
        if (diffMs < 0 && !newFiredAlerts.includes(overdueKey)) {
          newFiredAlerts.push(overdueKey);
          hasNewAlert = true;
          showToast(`Tenggat Lewat: "${task.title}"!`, 'error');
        }

        // 2. Check 15 mins reminder
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

  const triggerManualSync = () => {
    setSyncStatus('connecting');
    showToast('Menghubungkan ke server sinkronisasi...', 'info');
    performSync().then(() => {
      if (stateRef.current.syncStatus === 'online') {
        showToast('Sinkronisasi berhasil!', 'success');
      } else {
        showToast('Gagal menyinkronkan. Bekerja offline.', 'warning');
      }
    });
  };

  const recordLocalMutation = () => {
    const now = Date.now();
    setLocalLastUpdated(now);
  };

  const addTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      completed: false,
      priority: migratePriority(newTaskData.priority),
    };
    
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    recordLocalMutation();
    showToast(`Tugas "${newTask.title}" berhasil ditambahkan!`, 'success');
    
    // Attempt push immediately
    pushToServer(updatedTasks, categories);
  };

  const updateTask = (id: string, updatedFields: Partial<Task>) => {
    let showCompleteToast = false;
    let taskName = '';
    
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const merged = { 
          ...task, 
          ...updatedFields, 
          priority: updatedFields.priority ? migratePriority(updatedFields.priority) : task.priority 
        };
        if (updatedFields.completed && !task.completed) {
          showCompleteToast = true;
          taskName = task.title;
        }
        return merged;
      }
      return task;
    });

    setTasks(updatedTasks);
    recordLocalMutation();
    if (showCompleteToast) {
      showToast(`Tugas "${taskName}" selesai dikerjakan.`, 'success');
    }
    
    // Attempt push immediately
    pushToServer(updatedTasks, categories);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const updatedTasks = tasks.filter(t => t.id !== id);
    
    setTasks(updatedTasks);
    recordLocalMutation();
    if (taskToDelete) {
      showToast(`Tugas "${taskToDelete.title}" dihapus.`, 'error');
    }
    
    // Attempt push immediately
    pushToServer(updatedTasks, categories);
  };

  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + Math.random().toString(36).substr(2, 9)
    };
    
    const updatedCats = [...categories, newCat];
    setCategories(updatedCats);
    recordLocalMutation();
    showToast(`Kategori "${newCat.name}" berhasil dibuat!`, 'success');
    
    // Attempt push immediately
    pushToServer(tasks, updatedCats);
  };

  const updateCategory = (id: string, name: string, color: string) => {
    const oldCategory = categories.find(c => c.id === id);
    
    const updatedCats = categories.map(cat => (cat.id === id ? { ...cat, name, color } : cat));
    setCategories(updatedCats);
    
    let updatedTasks = tasks;
    if (oldCategory && oldCategory.name !== name) {
      updatedTasks = tasks.map(task => {
        if (task.category === oldCategory.name) {
          return { ...task, category: name };
        }
        return task;
      });
      setTasks(updatedTasks);
    }
    
    recordLocalMutation();
    showToast(`Kategori "${name}" diperbarui.`, 'success');
    
    // Attempt push immediately
    pushToServer(updatedTasks, updatedCats);
  };

  const deleteCategory = (id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    if (!catToDelete) return;
    
    const updatedCats = categories.filter(c => c.id !== id);
    setCategories(updatedCats);
    
    const updatedTasks = tasks.map(task => {
      if (task.category === catToDelete.name) {
        return { ...task, category: 'Pribadi' };
      }
      return task;
    });
    setTasks(updatedTasks);
    
    recordLocalMutation();
    showToast(`Kategori "${catToDelete.name}" dihapus.`, 'error');
    
    // Attempt push immediately
    pushToServer(updatedTasks, updatedCats);
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
        syncStatus,
        toggleTheme,
        addTask,
        updateTask,
        deleteTask,
        addCategory,
        updateCategory,
        deleteCategory,
        showToast,
        hideToast,
        triggerManualSync
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
