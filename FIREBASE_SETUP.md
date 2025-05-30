# Firebase設定手順

このドキュメントでは、GrowLogアプリでFirebase Authenticationを設定する手順を説明します。

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例：GrowLog）
4. Google Analyticsを有効にするかどうかを選択
5. プロジェクトを作成

## 2. Firebase Authenticationの設定

1. Firebaseコンソールで「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブで以下を有効にする：
   - **メール/パスワード**: 有効にして保存
   - **Google** (オプション): 後で設定する場合は、Google Cloud Consoleでの設定が必要

## 3. Firestoreの設定

1. Firebaseコンソールで「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. セキュリティルールを選択：
   - 開発中は「テストモードで開始」を選択
   - 本番環境では適切なセキュリティルールを設定
4. ロケーションを選択（asia-northeast1 推奨）

## 4. React Native アプリの設定

### iOS の設定

1. Firebaseコンソールで「プロジェクトの設定」→「マイアプリ」
2. iOS アプリを追加
3. Bundle ID を入力（例：com.yourcompany.growlog）
4. `GoogleService-Info.plist` をダウンロード
5. ファイルを `ios/` フォルダに配置

### Android の設定

1. Firebaseコンソールで「プロジェクトの設定」→「マイアプリ」
2. Android アプリを追加
3. パッケージ名を入力（例：com.yourcompany.growlog）
4. `google-services.json` をダウンロード
5. ファイルを `android/app/` フォルダに配置

## 5. アプリでの設定

1. `firebase.config.ts` ファイルを開く
2. Firebaseコンソールの「プロジェクトの設定」→「全般」→「マイアプリ」から設定情報を取得
3. 以下の設定値を置き換える：

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",                    // Web API Key
  authDomain: "your-project.firebaseapp.com", // Project ID + ".firebaseapp.com"
  projectId: "your-project-id",              // Project ID
  storageBucket: "your-project.firebasestorage.app", // Project ID + ".firebasestorage.app"
  messagingSenderId: "123456789",            // Project Number
  appId: "your-app-id"                       // App ID
};
```

## 6. セキュリティルールの設定

開発完了後、以下のFirestoreセキュリティルールを適用してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーコレクション：認証済みユーザーのみ自分のドキュメントにアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 振り返りデータ：認証済みユーザーのみ自分のデータにアクセス可能
    match /reflections/{reflectionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 7. テスト用アカウントの作成

1. アプリを起動
2. 新規登録画面でテスト用アカウントを作成
3. Firebaseコンソールの「Authentication」→「Users」でユーザーが作成されていることを確認

## トラブルシューティング

### よくある問題

1. **Firebase設定エラー**
   - `firebase.config.ts` の設定値が正しいことを確認
   - プロジェクトIDやAPI Keyに typo がないか確認

2. **認証エラー**
   - Firebaseコンソールでメール/パスワード認証が有効になっているか確認
   - ネットワーク接続を確認

3. **Firestoreエラー**
   - セキュリティルールが適切に設定されているか確認
   - 開発中はテストモードにしているか確認

4. **iOS ビルドエラー（Firebase Swiftポッド）**
   
   **エラー内容:**
   ```
   Command `pod install` failed.
   The following Swift pods cannot yet be integrated as static libraries:
   The Swift pod `FirebaseAuth` depends upon `FirebaseAuthInterop`, `FirebaseAppCheckInterop`, `FirebaseCore`, `FirebaseCoreExtension`, `GoogleUtilities`, and `RecaptchaInterop`, which do not define modules.
   ```
   
   **解決方法:**
   
   a) `ios/Podfile` を開く
   
   b) `target 'GrowLog' do` ブロック内の `use_expo_modules!` の直後に以下を追加：
   ```ruby
   target 'GrowLog' do
     use_expo_modules!
     use_modular_headers!  # ← この行を追加
   ```
   
   c) ポッドキャッシュをクリアして再インストール：
   ```bash
   cd ios
   pod deintegrate
   pod cache clean --all
   pod install
   ```
   
   d) プロジェクトルートに戻ってアプリを実行：
   ```bash
   cd ..
   npx expo run:ios
   ```
   
   **説明:** `use_modular_headers!` を追加することで、Firebase SwiftポッドがStatic Librariesとして正しく統合されるように、モジュラーヘッダーが有効化されます。

5. **iOS ビルドエラー（React-RuntimeHermesモジュール競合）**
   
   **エラー内容:**
   ```
   ❌  Pods/React-RuntimeHermes: Redefinition of module 'react_runtime'
   ❌  Pods/React-RuntimeHermes: Could not build module 'TargetConditionals'
   ```
   
   **原因:** `use_modular_headers!` をすべてのポッドに適用すると、一部のReactモジュールで競合が発生します。
   
   **解決方法:**
   
   a) `ios/Podfile` で `use_modular_headers!` をコメントアウト
   
   b) 個別のFirebaseポッドにのみmodular headersを指定：
   ```ruby
   target 'GrowLog' do
     use_expo_modules!
     # use_modular_headers!  # コメントアウト
     
     # Firebase関連ポッドにmodular headersを指定
     pod 'Firebase', :modular_headers => true
     pod 'FirebaseAuth', :modular_headers => true
     pod 'FirebaseCore', :modular_headers => true
     pod 'FirebaseCoreExtension', :modular_headers => true
     pod 'FirebaseAuthInterop', :modular_headers => true
     pod 'FirebaseAppCheckInterop', :modular_headers => true
     pod 'FirebaseCoreInternal', :modular_headers => true
     pod 'GoogleUtilities', :modular_headers => true
     pod 'RecaptchaInterop', :modular_headers => true
   ```
   
   c) ポッドを再インストール：
   ```bash
   cd ios
   pod deintegrate
   pod cache clean --all
   pod install
   cd ..
   npx expo run:ios
   ```

6. **iOS ビルドエラー（FirebaseAuth-Swift.h not found）**
   
   **エラー内容:**
   ```
   Pods/RNFBApp: 'FirebaseAuth/FirebaseAuth-Swift.h' file not found
   ```
   
   **原因:** 手動で追加したFirebaseポッドとReact Native Firebaseライブラリとの間で依存関係の競合が発生しています。
   
   **解決方法:**
   
   a) `ios/Podfile` から手動で追加したFirebaseポッドをすべて削除
   
   b) `use_modular_headers!` を復活させて、post_installでReactランタイムの競合を回避：
   ```ruby
   target 'GrowLog' do
     use_expo_modules!
     use_modular_headers!
     
     # 手動で追加したFirebaseポッドは削除
     
     post_install do |installer|
       react_native_post_install(
         installer,
         config[:reactNativePath],
         :mac_catalyst_enabled => false,
         :ccache_enabled => podfile_properties['apple.ccacheEnabled'] == 'true',
       )
       
       # React関連のポッドをmodular headersから除外
       installer.pods_project.targets.each do |target|
         if target.name.start_with?('React-Runtime') || target.name.include?('react_runtime')
           target.build_configurations.each do |config|
             config.build_settings.delete('DEFINES_MODULE')
           end
         end
       end
     end
   end
   ```
   
   c) ポッドを完全にクリーンアップして再インストール：
   ```bash
   cd ios
   pod deintegrate
   pod cache clean --all
   pod install
   cd ..
   npx expo run:ios
   ```
   
   **説明:** React Native Firebaseライブラリが管理するFirebase依存関係に任せることで、競合を避けてSwiftヘッダーファイルを正しく生成できます。

### 参考リンク

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Firebase](https://docs.expo.dev/guides/using-firebase/)

## セキュリティ注意事項

- 本番環境では必ず適切なセキュリティルールを設定してください
- API Keyなどの設定情報はGitにコミットしても問題ありませんが、プライベートキーは絶対に公開しないでください
- 定期的にFirebase使用量を確認し、予期しない課金を避けてください 