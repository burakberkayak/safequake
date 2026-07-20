import { NavigatorScreenParams } from '@react-navigation/native';
import { Earthquake } from '../features/earthquake/types/earthquake.types';

/**
 * PRD §7-8: Ana Sayfa'dan bir depreme dokunulduğunda Harita'ya, o depremin
 * koordinatına odaklanmış ve detay bottom sheet'i açık şekilde geçilebilmesi
 * için `focusedEarthquakeId` ve `focusedEarthquake` parametresi taşınıyor.
 */
export type MapTabParamList = {
  MapHome: { 
    focusedEarthquakeId?: string;
    focusedEarthquake?: Earthquake;
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
  Map: {
    focusedEarthquakeId?: string;
    focusedEarthquake?: Earthquake;
  } | undefined;
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
