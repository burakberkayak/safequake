import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

/**
 * PRD §21: "Her ekran Loading, Empty State, Error State, Skeleton içermelidir."
 * Bu üç bileşen (+ SkeletonBlock) tüm feature ekranlarında yeniden kullanılır,
 * böylece her ekran kendi loading/error UI'sini tekrar yazmaz (DRY).
 */

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>
      ) : null}
    </View>
  );
};

interface EmptyStateProps {
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
      {description ? (
        <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{description}</Text>
      ) : null}
    </View>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Bir şeyler ters gitti.',
  onRetry,
}) => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: colors.red }]}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>Tekrar Dene</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export const SkeletonBlock: React.FC<{ height?: number; width?: number | `${number}%` }> = ({
  height = 80,
  width = '100%',
}) => {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.skeleton,
        { height, width, backgroundColor: colors.surfaceVariant },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  skeleton: {
    borderRadius: 12,
    marginBottom: 12,
    opacity: 0.6,
  },
});
