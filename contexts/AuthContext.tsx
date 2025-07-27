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
const STORAGE_KEY = 'growlog_user';

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

  // ユーザー情報をAsyncStorageに保存
  const saveUserToStorage = async (user: FirebaseUser | null) => {
    try {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        console.log('ユーザー情報を永続化しました:', user.email);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('ユーザー情報を削除しました');
      }
    } catch (error) {
      console.error('ユーザー情報の永続化エラー:', error);
    }
  };

  // アプリ起動時に永続化されたユーザー情報を読み込み
  const loadPersistedUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        console.log('永続化されたユーザー情報を発見:', userData.email);
        // Firebase Authの状態が復元されるまで一時的にユーザー情報を設定
        setUser(userData as FirebaseUser);
      }
    } catch (error) {
      console.error('永続化ユーザーの読み込みエラー:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // アプリ起動時に永続化されたユーザー情報を読み込み
    loadPersistedUser();

    // Firebase Authの状態変化を監視
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      console.log('Firebase Auth状態変化:', firebaseUser ? `ログイン: ${firebaseUser.email}` : 'ログアウト');
      
      setUser(firebaseUser);
      await saveUserToStorage(firebaseUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('ログインを開始:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('ログイン成功:', userCredential.user.email);
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      console.log('アカウント作成を開始:', email);
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
        console.log('Firestoreにユーザードキュメントを作成しました');
      } catch (firestoreError) {
        console.warn('Firestoreユーザードキュメント作成に失敗しましたが、認証は成功しました:', firestoreError);
      }
      
      console.log('アカウント作成成功:', user.email);
    } catch (error) {
      console.error('アカウント作成エラー:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('ログアウトを開始');
      await signOut(auth);
      console.log('ログアウト成功');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('パスワードリセットメール送信成功');
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
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