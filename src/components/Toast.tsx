import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemeColors } from '../theme';

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  onClose: () => void;
  colors: ThemeColors;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, colors }) => {
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
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle' as const,
          color: colors.success,
          bg: 'rgba(16, 185, 129, 0.12)',
        };
      case 'warning':
        return {
          icon: 'alert-triangle' as const,
          color: colors.warning,
          bg: 'rgba(245, 158, 11, 0.12)',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: colors.danger,
          bg: 'rgba(239, 68, 68, 0.12)',
        };
      case 'info':
        return {
          icon: 'info' as const,
          color: colors.info,
          bg: 'rgba(6, 182, 212, 0.12)',
        };
    }
  };

  const config = getToastConfig();
  const styles = getStyles(colors);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: config.color,
        },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
        <Feather name={config.icon} size={14} color={config.color} />
      </View>
      <Text style={styles.messageText}>{message}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Feather name="x" size={13} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
    borderColor: colors.border,
    borderLeftWidth: 4,
    backgroundColor: colors.bgMain,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messageText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: 6,
  },
});
