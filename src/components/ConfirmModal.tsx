import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ThemeColors } from '../theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  colors: ThemeColors;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  colors,
}) => {
  const styles = getStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Circular Red Alert Icon */}
          <View style={styles.iconCircle}>
            <Feather name="trash-2" size={20} color={colors.danger} />
          </View>

          {/* Text Content */}
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          {/* Buttons Row */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmBtn} 
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Feather name="trash-2" size={13} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.bgMain,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)', // Subtle red border
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
});
