import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import type { ThemeColors } from '../theme';

interface ValidationErrorProps {
  message: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ message }) => {
  const { colors } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [message]);

  if (!message) return null;

  const styles = getStyles(colors);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Feather name="alert-circle" size={11} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '600',
  },
});
