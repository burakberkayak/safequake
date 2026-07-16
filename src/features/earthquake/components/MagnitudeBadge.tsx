import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getMagnitudeColor } from '../../../theme/colors';

interface MagnitudeBadgeProps {
  magnitude: number;
  size?: 'small' | 'large';
}

export const MagnitudeBadge: React.FC<MagnitudeBadgeProps> = ({
  magnitude,
  size = 'small',
}) => {
  const color = getMagnitudeColor(magnitude);
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          width: isLarge ? 64 : 40,
          height: isLarge ? 64 : 40,
          borderRadius: isLarge ? 32 : 20,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: isLarge ? 22 : 14 }]}>
        {magnitude.toFixed(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
