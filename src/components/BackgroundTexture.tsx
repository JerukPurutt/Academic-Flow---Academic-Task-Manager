import React from 'react';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';

interface BackgroundTextureProps {
  isDark: boolean;
}

export const BackgroundTexture: React.FC<BackgroundTextureProps> = ({ isDark }) => {
  const { width, height } = useWindowDimensions();

  // Color configurations for a soft, peaceful, and focus-inducing atmosphere
  const colors = isDark 
    ? {
        glow1: 'rgba(99, 102, 241, 0.08)',   // Indigo (Soft Intelligence)
        glow2: 'rgba(16, 185, 129, 0.05)',   // Emerald/Mint (Growth & Peace)
        glow3: 'rgba(168, 85, 247, 0.06)',   // Purple (Creativity & Calm)
        dotColor: 'rgba(255, 255, 255, 0.03)',
      }
    : {
        glow1: 'rgba(79, 70, 229, 0.07)',    // Indigo
        glow2: 'rgba(16, 185, 129, 0.05)',    // Emerald/Mint
        glow3: 'rgba(147, 51, 234, 0.06)',    // Purple
        dotColor: 'rgba(15, 23, 42, 0.04)',
      };

  const pointerProp = Platform.OS === 'web' ? {} : { pointerEvents: 'none' as const };

  return (
    <View 
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none', overflow: 'hidden' } as any]} 
      {...pointerProp}
    >
      {/* Glow 1 - Top Left (Intellect/Focus) */}
      <View style={[
        styles.glowCircle,
        {
          width: width * 0.6,
          height: width * 0.6,
          borderRadius: (width * 0.6) / 2,
          top: -width * 0.2,
          left: -width * 0.15,
          backgroundColor: colors.glow1,
          ...Platform.select({
            web: { filter: 'blur(120px)' },
          }),
        } as any
      ]} />

      {/* Glow 2 - Bottom Right (Growth/Tranquility) */}
      <View style={[
        styles.glowCircle,
        {
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: (width * 0.7) / 2,
          bottom: -width * 0.25,
          right: -width * 0.15,
          backgroundColor: colors.glow2,
          ...Platform.select({
            web: { filter: 'blur(140px)' },
          }),
        } as any
      ]} />

      {/* Glow 3 - Center Left (Creativity/Inspiration) */}
      <View style={[
        styles.glowCircle,
        {
          width: width * 0.5,
          height: width * 0.5,
          borderRadius: (width * 0.5) / 2,
          top: height * 0.25,
          left: width * 0.15,
          backgroundColor: colors.glow3,
          ...Platform.select({
            web: { filter: 'blur(100px)' },
          }),
        } as any
      ]} />

      {/* Web-specific CSS Dot Grid overlay */}
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{__html: `
          .dot-grid-bg {
            background-image: radial-gradient(circle, ${colors.dotColor} 1px, transparent 1px);
            background-size: 26px 26px;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
            opacity: 0.9;
          }
        `}} />
      )}

      {Platform.OS === 'web' && <View className="dot-grid-bg" style={StyleSheet.absoluteFill} />}
    </View>
  );
};

const styles = StyleSheet.create({
  glowCircle: {
    position: 'absolute',
    opacity: 0.8,
  },
});
