import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemeColors } from '../theme';

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  onClose: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, colors, isDark }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const getToastConfig = () => {
    if (isDark) {
      switch (type) {
        case 'success':
          return {
            icon: 'check' as const,
            iconColor: '#10b981',
            textColor: '#34d399',
            borderColor: 'rgba(16, 185, 129, 0.15)',
            bg: '#18181b',
            closeColor: '#52525b',
          };
        case 'warning':
          return {
            icon: 'alert-triangle' as const,
            iconColor: '#f59e0b',
            textColor: '#fbbf24',
            borderColor: 'rgba(245, 158, 11, 0.15)',
            bg: '#18181b',
            closeColor: '#52525b',
          };
        case 'error':
          return {
            icon: 'alert-circle' as const,
            iconColor: '#ef4444',
            textColor: '#f87171',
            borderColor: 'rgba(239, 68, 68, 0.15)',
            bg: '#18181b',
            closeColor: '#52525b',
          };
        case 'info':
          return {
            icon: 'info' as const,
            iconColor: '#0ea5e9',
            textColor: '#38bdf8',
            borderColor: 'rgba(6, 182, 212, 0.15)',
            bg: '#18181b',
            closeColor: '#52525b',
          };
      }
    } else {
      switch (type) {
        case 'success':
          return {
            icon: 'check' as const,
            iconColor: '#059669',
            textColor: '#065f46',
            borderColor: '#a7f3d0',
            bg: '#ecfdf5',
            closeColor: '#059669',
          };
        case 'warning':
          return {
            icon: 'alert-triangle' as const,
            iconColor: '#d97706',
            textColor: '#78350f',
            borderColor: '#fde68a',
            bg: '#fffbeb',
            closeColor: '#d97706',
          };
        case 'error':
          return {
            icon: 'alert-circle' as const,
            iconColor: '#dc2626',
            textColor: '#991b1b',
            borderColor: '#fecaca',
            bg: '#fef2f2',
            closeColor: '#dc2626',
          };
        case 'info':
          return {
            icon: 'info' as const,
            iconColor: '#0284c7',
            textColor: '#075985',
            borderColor: '#bae6fd',
            bg: '#f0f9ff',
            closeColor: '#0284c7',
          };
      }
    }
  };

  const config = getToastConfig();
  const styles = getStyles();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderColor: config.borderColor,
          backgroundColor: config.bg,
        },
      ]}
    >
      <Feather name={config.icon} size={16} color={config.iconColor} style={styles.toastIcon} />
      <Text style={[styles.messageText, { color: config.textColor }]}>{message}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Feather name="x" size={13} color={config.closeColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = () => StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  toastIcon: {
    marginRight: 10,
  },
  messageText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: 6,
  },
});
