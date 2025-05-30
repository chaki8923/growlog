import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthButton } from '../../components/auth/AuthButton';
import { AuthInput } from '../../components/auth/AuthInput';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register } = useAuth();

  const validateForm = () => {
    const newErrors: {
      displayName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!displayName.trim()) {
      newErrors.displayName = '名前を入力してください';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = '名前は2文字以上で入力してください';
    }

    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '正しいメールアドレスを入力してください';
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'パスワードは英数字を含む必要があります';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'パスワード（確認用）を入力してください';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await register(email, password, displayName.trim());
      Alert.alert(
        '登録完了',
        'アカウントが正常に作成されました！',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = 'アカウント作成に失敗しました';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '無効なメールアドレスです';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます';
      }

      Alert.alert('エラー', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F3F4F6', '#E5E7EB']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.iconGradient}
              >
                <Ionicons name="person-add" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>新規登録</Text>
            <Text style={styles.subtitle}>
              アカウントを作成して振り返りの旅を始めましょう
            </Text>
          </View>

          <View style={styles.formContainer}>
            <AuthInput
              label="お名前"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="山田太郎"
              autoCapitalize="words"
              error={errors.displayName}
            />

            <AuthInput
              label="メールアドレス"
              value={email}
              onChangeText={setEmail}
              placeholder="your@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <AuthInput
              label="パスワード"
              value={password}
              onChangeText={setPassword}
              placeholder="6文字以上の英数字"
              secureTextEntry
              error={errors.password}
            />

            <AuthInput
              label="パスワード（確認用）"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="上記と同じパスワードを入力"
              secureTextEntry
              error={errors.confirmPassword}
            />

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                アカウントを作成することで、
                <TouchableOpacity>
                  <Text style={styles.termsLink}>利用規約</Text>
                </TouchableOpacity>
                と
                <TouchableOpacity>
                  <Text style={styles.termsLink}>プライバシーポリシー</Text>
                </TouchableOpacity>
                に同意したものとみなします。
              </Text>
            </View>

            <AuthButton
              title="アカウントを作成"
              onPress={handleRegister}
              loading={loading}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>既にアカウントをお持ちの方は </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>ログイン</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  termsLink: {
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
}); 