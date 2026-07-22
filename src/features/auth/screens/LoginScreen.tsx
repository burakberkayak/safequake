import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setLanguage, setThemeMode } from '../../../store/slices/settingsSlice';

type LoginSchemaType = {
  email: string;
  password: string;
};

export const LoginScreen: React.FC = () => {
  const { colors, setMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { loginWithEmail, loginAnonymously, loginWithGoogle, loading, error } = useAuth();
  const { language } = useTranslation();
  const themeMode = useAppSelector((state) => state.settings.themeMode);
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = useMemo(() => z.object({
    email: z.string()
      .min(1, language === 'tr' ? 'E-posta adresi gereklidir.' : 'Email address is required.')
      .email(language === 'tr' ? 'Geçersiz e-posta adresi.' : 'Invalid email address.'),
    password: z.string()
      .min(6, language === 'tr' ? 'Şifre en az 6 karakter olmalıdır.' : 'Password must be at least 6 characters.'),
  }), [language]);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    try {
      await loginWithEmail(data.email.trim(), data.password);
    } catch (err) {
      // Handled inside auth slice/hook
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      // Handled inside auth slice/hook
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await loginAnonymously();
    } catch (err) {
      // Handled inside auth slice/hook
    }
  };

  const handleThemeCycle = () => {
    const nextMode = 
      themeMode === 'light' ? 'dark' : 
      themeMode === 'dark' ? 'system' : 'light';
    dispatch(setThemeMode(nextMode));
    setMode(nextMode);
  };

  const getFriendlyError = (errStr: string) => {
    if (!errStr) return '';
    const cleanErr = errStr.toLowerCase();
    if (cleanErr.includes('auth/invalid-credential') || cleanErr.includes('invalid-email') || cleanErr.includes('wrong-password') || cleanErr.includes('user-not-found')) {
      return language === 'tr' ? 'E-posta veya şifre hatalı.' : 'Invalid email or password.';
    }
    if (cleanErr.includes('auth/email-already-in-use')) {
      return language === 'tr' ? 'Bu e-posta adresi zaten kullanımda.' : 'This email address is already in use.';
    }
    if (errStr.includes('Firebase configuration is missing')) {
      return language === 'tr' ? 'Firebase yapılandırması eksik. Lütfen .env dosyasını kontrol edin.' : 'Firebase configuration is missing. Please check your .env file.';
    }
    if (errStr === 'Giriş yapılamadı.') {
      return language === 'tr' ? 'Giriş yapılamadı.' : 'Failed to sign in.';
    }
    return errStr;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header Controls Row */}
      <View style={styles.headerControlsRow}>
        {/* Theme Toggle */}
        <TouchableOpacity
          style={[
            styles.headerButton,
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
            }
          ]}
          onPress={handleThemeCycle}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={
              themeMode === 'light' ? 'sunny-outline' : 
              themeMode === 'dark' ? 'moon-outline' : 'contrast-outline'
            } 
            size={16} 
            color={colors.primary} 
          />
          <Text style={[styles.headerButtonText, { color: colors.onSurface }]}>
            {themeMode === 'light' 
              ? (language === 'tr' ? 'Açık' : 'Light')
              : themeMode === 'dark'
              ? (language === 'tr' ? 'Koyu' : 'Dark')
              : (language === 'tr' ? 'Sistem' : 'System')}
          </Text>
        </TouchableOpacity>

        {/* Language Toggle */}
        <TouchableOpacity
          style={[
            styles.headerButton,
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
            }
          ]}
          onPress={() => dispatch(setLanguage(language === 'tr' ? 'en' : 'tr'))}
          activeOpacity={0.8}
        >
          <Ionicons name="globe-outline" size={16} color={colors.primary} />
          <Text style={[styles.headerButtonText, { color: colors.onSurface }]}>
            {language === 'tr' ? 'EN' : 'TR'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="shield-checkmark" size={60} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.onBackground }]}>SafeQuake</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' 
                ? 'Güvenliğiniz için gerçek zamanlı deprem takibi ve acil durum rehberi' 
                : 'Real-time earthquake tracking and emergency guide for your safety'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.redContainer }]}>
                <Ionicons name="alert-circle" size={20} color={colors.red} />
                <Text style={[styles.errorText, { color: colors.red }]}>{getFriendlyError(error)}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                {language === 'tr' ? 'E-Posta' : 'Email'}
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { borderColor: errors.email ? colors.red : colors.border, backgroundColor: colors.surface }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder={language === 'tr' ? "ornek@email.com" : "example@email.com"}
                      placeholderTextColor={colors.onSurfaceVariant + '70'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={{ color: colors.red, fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                {language === 'tr' ? 'Şifre' : 'Password'}
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { borderColor: errors.password ? colors.red : colors.border, backgroundColor: colors.surface }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder="••••••"
                      placeholderTextColor={colors.onSurfaceVariant + '70'}
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={colors.onSurfaceVariant} 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={{ color: colors.red, fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                  {language === 'tr' ? 'Giriş Yap' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>
                {language === 'tr' ? 'veya' : 'or'}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google ile Giriş Yap */}
            <TouchableOpacity 
              style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color={colors.primary} />
              <Text style={[styles.googleButtonText, { color: colors.onSurface }]}>
                {language === 'tr' ? 'Google ile Giriş Yap' : 'Sign in with Google'}
              </Text>
            </TouchableOpacity>

            {/* Misafir Girişi */}
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={handleAnonymousLogin}
              disabled={loading}
            >
              <Text style={[styles.guestButtonText, { color: colors.primary }]}>
                {language === 'tr' ? 'Misafir Olarak Devam Et' : 'Continue as Guest'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: colors.onSurfaceVariant }}>
                {language === 'tr' ? 'Hesabınız yok mu? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.link, { color: colors.primary }]}>
                  {language === 'tr' ? 'Kayıt Olun' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    fontWeight: 'bold',
  },
  headerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  googleButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
