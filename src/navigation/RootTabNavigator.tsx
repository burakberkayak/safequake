import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeProvider';
import { HomeScreen } from '../features/earthquake';
import { MapScreen } from '../features/map';
import { EmergencyNavigator } from '../features/emergency/navigation/EmergencyNavigator';
import { FamilyScreen } from '../features/family/screens/FamilyScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useTranslation } from '../hooks/useTranslation';
import { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootTabNavigator: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapNavigatorAdapter}
        options={{
          title: t('tabMap'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyNavigator}
        options={{
          title: t('tabEmergency'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          title: t('tabFamily'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MapNavigatorAdapter: React.FC = () => <MapScreen />;
