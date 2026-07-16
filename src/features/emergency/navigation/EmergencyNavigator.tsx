import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EmergencyHubScreen } from '../screens/EmergencyHubScreen';
import { EmergencyCardScreen } from '../screens/EmergencyCardScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { EducationScreen } from '../screens/EducationScreen';

export type EmergencyStackParamList = {
  EmergencyHub: undefined;
  EmergencyCard: undefined;
  Checklist: undefined;
  Education: undefined;
};

const Stack = createNativeStackNavigator<EmergencyStackParamList>();

export const EmergencyNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="EmergencyHub" component={EmergencyHubScreen} />
      <Stack.Screen name="EmergencyCard" component={EmergencyCardScreen} />
      <Stack.Screen name="Checklist" component={ChecklistScreen} />
      <Stack.Screen name="Education" component={EducationScreen} />
    </Stack.Navigator>
  );
};
