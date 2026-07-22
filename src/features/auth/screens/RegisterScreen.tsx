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

type RegisterSchemaType = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const RegisterScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { registerWithEmail, loading, error } = useAuth();
  const { language } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const registerSchema = useMemo(() => z.object({
    name: z.string().min(1, language === 'tr' ? 'Ad soyad gereklidir.' : 'Full name is required.'),
    email: z.string()
      .min(1, language === 'tr' ? 'E-posta adresi gereklidir.' : 'Email address is required.')
      .email(language === 'tr' ? 'Geçersiz e-posta adresi.' : 'Invalid email address.'),
    password: z.string().min(6, language === 'tr' ? 'Şifre en az 6 karakter olmalıdır.' : 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, language === 'tr' ? 'Şifre tekrarı gereklidir.' : 'Confirm password is required.'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: language === 'tr' ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.',
    path: ['confirmPassword'],
  }), [language]);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterSchemaType) => {
    try {
      await registerWithEmail(data.email.trim(), data.password, data.name.trim());
    } catch (err) {
      // Handled inside slice/hook
    }
  };

  const getFriendlyError = (errStr: string) => {
    if (!errStr) return '';
    const cleanErr = errStr.toLowerCase();
    if (cleanErr.includes('auth/email-already-in-use')) {
      return language === 'tr' ? 'Bu e-posta adresi zaten kullanımda.' : 'This email address is already in use.';
    }
    if (cleanErr.includes('auth/invalid-email')) {
      return language === 'tr' ? 'Geçersiz e-posta adresi.' : 'Invalid email address.';
    }
    if (errStr.includes('Firebase configuration is missing')) {
      return language === 'tr' ? 'Firebase yapılandırması eksik. Lütfen .env dosyasını kontrol edin.' : 'Firebase configuration is missing. Please check your .env file.';
    }
    if (errStr === 'Kayıt olunamadı.') {
      return language === 'tr' ? 'Kayıt olunamadı.' : 'Failed to register.';
    }
    return errStr;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.onBackground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.onBackground }]}>
              {language === 'tr' ? 'Kayıt Ol' : 'Register'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' 
                ? 'SafeQuake ailesine katılın ve yakınlarınızın güvenliğini sağlayın' 
                : 'Join the SafeQuake family and ensure the safety of your relatives'}
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
                {language === 'tr' ? 'Ad Soyad' : 'Full Name'}
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { borderColor: errors.name ? colors.red : colors.border, backgroundColor: colors.surface }]}>
                    <Ionicons name="person-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder={language === 'tr' ? "ör. Ahmet Yılmaz" : "e.g. John Doe"}
                      placeholderTextColor={colors.onSurfaceVariant + '70'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              />
              {errors.name && (
                <Text style={{ color: colors.red, fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                  {errors.name.message}
                </Text>
              )}
            </View>

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
                      placeholder={language === 'tr' ? "ör. ahmet@mail.com" : "e.g. john@mail.com"}
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

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                {language === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { borderColor: errors.confirmPassword ? colors.red : colors.border, backgroundColor: colors.surface }]}>
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
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={{ color: colors.red, fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                  {errors.confirmPassword.message}
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
                  {language === 'tr' ? 'Kayıt Ol' : 'Register'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: colors.onSurfaceVariant }}>
                {language === 'tr' ? 'Zaten hesabınız var mı? ' : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.link, { color: colors.primary }]}>
                  {language === 'tr' ? 'Giriş Yapın' : 'Login'}
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
    marginBottom: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 4,
    padding: 4,
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
    marginBottom: 14,
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
    marginTop: 20,
  },
  link: {
    fontWeight: 'bold',
  },
});
