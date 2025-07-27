import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase.config';

// ストレージキー
const STORAGE_KEY = 'growlog_user_data';
const AUTH_STATE_KEY = 'growlog_auth_state';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ユーザー情報をAsyncStorageに保存
  const saveUserToStorage = async (user: FirebaseUser | null) => {
    try {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        await AsyncStorage.setItem(AUTH_STATE_KEY, 'authenticated');
        console.log('✅ ユーザー情報を永続化しました:', user.email);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        await AsyncStorage.removeItem(AUTH_STATE_KEY);
        console.log('🗑️ ユーザー情報を削除しました');
      }
    } catch (error) {
      console.error('❌ ユーザー情報の永続化エラー:', error);
    }
  };

  // アプリ起動時に永続化されたユーザー情報を読み込み
  const loadPersistedUser = async () => {
    try {
      console.log('🔄 永続化データの読み込みを開始...');
      
      const [userJson, authState] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(AUTH_STATE_KEY)
      ]);
      
      if (userJson && authState === 'authenticated') {
        const userData = JSON.parse(userJson);
        const isRecent = userData.timestamp && (Date.now() - userData.timestamp) < 30 * 24 * 60 * 60 * 1000; // 30日以内
        
        if (isRecent) {
          console.log('✅ 永続化されたユーザー情報を復元:', userData.email);
          setUser(userData as FirebaseUser);
          return true;
        } else {
          console.log('⏰ 永続化データが古いため削除します');
          await saveUserToStorage(null);
        }
      } else {
        console.log('📭 永続化データが見つかりません');
      }
      
      return false;
    } catch (error) {
      console.error('❌ 永続化ユーザーの読み込みエラー:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authUnsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        console.log('🚀 認証初期化を開始...');
        
        // 永続化されたユーザー情報を読み込み
        const hasPersistedUser = await loadPersistedUser();
        
        // Firebase Authの状態変化を監視（React Nativeでは自動的に永続化される）
        authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!mounted) return;

          console.log('🔔 Firebase Auth状態変化:', firebaseUser ? `ログイン: ${firebaseUser.email}` : 'ログアウト');
          
          if (firebaseUser) {
            // Firebase Authから復元された場合
            setUser(firebaseUser);
            await saveUserToStorage(firebaseUser);
          } else {
            // ログアウトまたは認証なしの場合
            if (!hasPersistedUser) {
              setUser(null);
              await saveUserToStorage(null);
            } else {
              // 永続化データがあるがFirebase Authがnullの場合、少し待機
              console.log('⏳ Firebase Auth復元を待機中...');
              setTimeout(async () => {
                if (mounted && !auth.currentUser) {
                  console.log('⏰ Firebase Auth復元タイムアウト、永続化データを使用');
                  // 永続化データを維持
                }
              }, 3000);
            }
          }
          
          if (!isInitialized) {
            setIsInitialized(true);
            setLoading(false);
            console.log('✅ 認証初期化完了');
          }
        });
        
        // 8秒後に強制的に初期化完了
        setTimeout(() => {
          if (!isInitialized && mounted) {
            console.log('⏰ タイムアウト：認証初期化を強制完了');
            setIsInitialized(true);
            setLoading(false);
          }
        }, 8000);
        
      } catch (error) {
        console.error('❌ 認証初期化エラー:', error);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 ログインを開始:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ ログイン成功:', userCredential.user.email);
      
      // 手動で永続化を確実に実行
      await saveUserToStorage(userCredential.user);
    } catch (error) {
      console.error('❌ ログインエラー:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      console.log('📝 アカウント作成を開始:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // プロフィール更新
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Firestoreにユーザー情報を保存（エラーハンドリング付き）
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: displayName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Firestoreにユーザードキュメントを作成しました');
      } catch (firestoreError) {
        console.warn('⚠️ Firestoreユーザードキュメント作成に失敗しましたが、認証は成功しました:', firestoreError);
      }
      
      // 手動で永続化を確実に実行
      await saveUserToStorage(user);
      console.log('✅ アカウント作成成功:', user.email);
    } catch (error) {
      console.error('❌ アカウント作成エラー:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 ログアウトを開始');
      
      // 先にストレージをクリア
      await saveUserToStorage(null);
      setUser(null);
      
      // Firebase Authからサインアウト
      await signOut(auth);
      console.log('✅ ログアウト成功');
    } catch (error) {
      console.error('❌ ログアウトエラー:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ パスワードリセットメール送信成功');
    } catch (error) {
      console.error('❌ パスワードリセットエラー:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 