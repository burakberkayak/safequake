import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { getMagnitudeColor } from '../../../theme/colors';

interface PulsingMarkerProps {
  magnitude: number;
}

export const PulsingMarker: React.FC<PulsingMarkerProps> = ({ magnitude }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const isMajor = magnitude >= 4.0;
  const dotColor = getMagnitudeColor(magnitude);

  useEffect(() => {
    if (!isMajor) return;

    const animation = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [isMajor, pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.7, 0.4, 0],
  });

  return (
    <View style={styles.container}>
      {isMajor && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: dotColor,
              transform: [{ scale }],
              opacity,
            },
          ]}
        />
      )}
      <View style={[styles.markerDot, { backgroundColor: dotColor }]}>
        <View style={styles.innerDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
