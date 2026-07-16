import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  setThemeMode, 
  setLanguage, 
  setLocationPermission, 
  setNotificationPermission, 
  setMinMagnitudeNotify,
  setMaxDistanceNotifyKm,
  AppThemeMode, 
  AppLanguage 
} from '../../../store/slices/settingsSlice';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const ProfileScreen: React.FC = () => {
  const { colors, setMode } = useAppTheme();
  const dispatch = useAppDispatch();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const settings = useAppSelector((state) => state.settings);

  const handleThemeChange = (newMode: AppThemeMode) => {
    dispatch(setThemeMode(newMode));
    setMode(newMode);
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    dispatch(setLanguage(newLang));
    const title = newLang === 'tr' ? 'Bilgi' : 'Info';
    const msg = newLang === 'tr' ? 'Dil seçeneği Türkçe olarak güncellendi.' : 'Language updated to English.';
    Alert.alert(title, msg);
  };

  const toggleLocation = async () => {
    if (settings.locationPermissionGranted) {
      dispatch(setLocationPermission(false));
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch(setLocationPermission(status === 'granted'));
    }
  };

  const toggleNotifications = async () => {
    if (settings.notificationPermissionGranted) {
      dispatch(setNotificationPermission(false));
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      dispatch(setNotificationPermission(status === 'granted'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      settings.language === 'tr' ? 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?' : 'Are you sure you want to sign out?',
      [
        { text: settings.language === 'tr' ? 'Vazgeç' : 'Cancel', style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: logout }
      ]
    );
  };

  const displayName = user?.displayName || 'Kullanıcı';
  const email = user?.email || 'e-posta belirtilmemiş';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.onSurface }]}>{displayName}</Text>
            <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>{email}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>{t('appSettings')}</Text>

          {/* Theme Settings */}
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.settingsCardLabel, { color: colors.onSurfaceVariant }]}>{t('theme')}</Text>
            <View style={styles.themeRow}>
              {(['light', 'dark', 'system'] as AppThemeMode[]).map((mode) => {
                const isActive = settings.themeMode === mode;
                const label = mode === 'light' ? t('themeLight') : mode === 'dark' ? t('themeDark') : t('themeSystem');
                const icon = mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'settings-outline';
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.themeButton,
                      { 
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? colors.primary + '15' : colors.background
                      }
                    ]}
                    onPress={() => handleThemeChange(mode)}
                  >
                    <Ionicons name={icon as any} size={16} color={isActive ? colors.primary : colors.onSurface} />
                    <Text style={[styles.themeText, { color: isActive ? colors.primary : colors.onSurface }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Language Settings */}
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.settingsCardLabel, { color: colors.onSurfaceVariant }]}>{t('languageSetting')}</Text>
            <View style={styles.themeRow}>
              {(['tr', 'en'] as AppLanguage[]).map((lang) => {
                const isActive = settings.language === lang;
                const label = lang === 'tr' ? 'Türkçe' : 'English';
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.themeButton,
                      { 
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? colors.primary + '15' : colors.background,
                        flex: 1,
                      }
                    ]}
                    onPress={() => handleLanguageChange(lang)}
                  >
                    <Text style={[styles.themeText, { color: isActive ? colors.primary : colors.onSurface }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Permission Switches */}
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border, gap: 16 }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={[styles.switchTitle, { color: colors.onSurface }]}>{t('locationSetting')}</Text>
                <Text style={[styles.switchDesc, { color: colors.onSurfaceVariant }]}>{t('locationSettingDesc')}</Text>
              </View>
              <Switch
                value={settings.locationPermissionGranted}
                onValueChange={toggleLocation}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={[styles.switchTitle, { color: colors.onSurface }]}>{t('notificationSetting')}</Text>
                <Text style={[styles.switchDesc, { color: colors.onSurfaceVariant }]}>{t('notificationSettingDesc')}</Text>
              </View>
              <Switch
                value={settings.notificationPermissionGranted}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* Notification Magnitude Threshold */}
          {settings.notificationPermissionGranted && (
            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.settingsCardLabel, { color: colors.onSurfaceVariant }]}>{t('minMagNotify')}</Text>
              <View style={styles.themeRow}>
                {([undefined, 3, 4, 5] as (number | undefined)[]).map((mag) => {
                  const isActive = settings.minMagnitudeNotify === mag;
                  const label = mag === undefined ? t('notifyAll') : `${mag}+`;
                  return (
                    <TouchableOpacity
                      key={mag ?? 'all'}
                      style={[
                        styles.themeButton,
                        { 
                          borderColor: isActive ? colors.primary : colors.border,
                          backgroundColor: isActive ? colors.primary + '15' : colors.background
                        }
                      ]}
                      onPress={() => dispatch(setMinMagnitudeNotify(mag))}
                    >
                      <Text style={[styles.themeText, { color: isActive ? colors.primary : colors.onSurface }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Notification Distance Threshold */}
          {settings.notificationPermissionGranted && settings.locationPermissionGranted && (
            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.settingsCardLabel, { color: colors.onSurfaceVariant }]}>{t('maxDistNotify')}</Text>
              <View style={styles.themeRow}>
                {([undefined, 50, 100, 250] as (number | undefined)[]).map((dist) => {
                  const isActive = settings.maxDistanceNotifyKm === dist;
                  const label = dist === undefined ? t('notifyAll') : `${dist} km`;
                  return (
                    <TouchableOpacity
                      key={dist ?? 'all'}
                      style={[
                        styles.themeButton,
                        { 
                          borderColor: isActive ? colors.primary : colors.border,
                          backgroundColor: isActive ? colors.primary + '15' : colors.background
                        }
                      ]}
                      onPress={() => dispatch(setMaxDistanceNotifyKm(dist))}
                    >
                      <Text style={[styles.themeText, { color: isActive ? colors.primary : colors.onSurface }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.red }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  settingsCardLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  themeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  switchDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  logoutButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
