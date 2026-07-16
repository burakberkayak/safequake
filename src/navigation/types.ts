import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * PRD §7-8: Ana Sayfa'dan bir depreme dokunulduğunda Harita'ya, o depremin
 * koordinatına odaklanmış ve detay bottom sheet'i açık şekilde geçilebilmesi
 * için `focusedEarthquakeId` parametresi taşınıyor.
 */
export type MapTabParamList = {
  MapHome: { 
    focusedEarthquakeId?: string;
    focusedLocation?: {
      latitude: number;
      longitude: number;
      name: string;
    };
  } | undefined;
};

import { EmergencyStackParamList } from '../features/emergency/navigation/EmergencyNavigator';

export type RootTabParamList = {
  Home: undefined;
  Map: NavigatorScreenParams<MapTabParamList>;
  Emergency: NavigatorScreenParams<EmergencyStackParamList>;
  Family: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
};

// declare global {
//   // eslint-disable-next-line @typescript-eslint/no-namespace
//   namespace ReactNavigation {
//     interface RootParamList extends RootStackParamList {}
//   }
// }
