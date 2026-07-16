import React, { useState } from 'react';
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

const registerSchema = z.object({
  name: z.string().min(1, 'Ad soyad gereklidir.'),
  email: z.string().min(1, 'E-posta adresi gereklidir.').email('Geçersiz e-posta adresi.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  confirmPassword: z.string().min(6, 'Şifre tekrarı gereklidir.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor.',
  path: ['confirmPassword'],
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export const RegisterScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { registerWithEmail, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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
            <Text style={[styles.title, { color: colors.onBackground }]}>Kayıt Ol</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              SafeQuake ailesine katılın ve yakınlarınızın güvenliğini sağlayın
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.redContainer }]}>
                <Ionicons name="alert-circle" size={20} color={colors.red} />
                <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Ad Soyad</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { borderColor: errors.name ? colors.red : colors.border, backgroundColor: colors.surface }]}>
                    <Ionicons name="person-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder="ör. Ahmet Yılmaz"
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
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>E-Posta</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { borderColor: errors.email ? colors.red : colors.border, backgroundColor: colors.surface }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder="ör. ahmet@mail.com"
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
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Şifre</Text>
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
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Şifre Tekrar</Text>
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
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: colors.onSurfaceVariant }}>Zaten hesabınız var mı? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.link, { color: colors.primary }]}>Giriş Yapın</Text>
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
