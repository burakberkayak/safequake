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

export const RegisterScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { registerWithEmail, loading, error } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Şifreler eşleşmiyor.');
      return;
    }
    setLocalError(null);
    try {
      await registerWithEmail(email.trim(), password, name.trim());
    } catch (err) {
      // Error is handled inside hook and exposed as 'error'
    }
  };

  const displayError = localError || error;

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
            {displayError && (
              <View style={[styles.errorContainer, { backgroundColor: colors.redContainer }]}>
                <Ionicons name="alert-circle" size={20} color={colors.red} />
                <Text style={[styles.errorText, { color: colors.red }]}>{displayError}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Ad Soyad</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="person-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="ör. Ahmet Yılmaz"
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>E-Posta</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="mail-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="ör. ahmet@mail.com"
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Şifre</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="••••••"
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Şifre Tekrar</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="••••••"
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
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
