# GrowLog アプリ

このプロジェクトは[Expo](https://expo.dev)を使用して開発されたReact Nativeアプリケーションです。

## 開発環境のセットアップ

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. Expo Dev Clientを使用して開発

   ```bash
   npm run dev-client
   # または
   npx expo start --dev-client
   ```

## 開発方法

- **app** ディレクトリ内のファイルを編集することで開発を進めることができます。
- このプロジェクトは[ファイルベースのルーティング](https://docs.expo.dev/router/introduction)を使用しています。

## ビルド方法

### 開発ビルド

```bash
npx expo prebuild
npx expo run:ios  # iOSビルド
npx expo run:android  # Androidビルド
```

## トラブルシューティング

### 開発環境でアプリが起動しない / エラーが出る場合

本プロジェクトは当初、Expo SDK 53で開発を開始しましたが、不安定だったためSDK 52にダウングレードしました。それに伴い、いくつかの問題が発生しました。

#### 1. SDKバージョンの不整合と依存関係の問題

- **症状**: `npx expo start`でQRコードを読み込んでもアプリが起動しない、または`Component ... has not been registered yet`のようなエラーが発生する。
- **解決策**: プロジェクト全体を安定しているSDK 52に統一しました。
  1. `app.json`の`sdkVersion`を`"52.0.0"`に設定。
  2. `package.json`の各種ライブラリ（`expo`, `react`, `react-native`, `expo-router`等）のバージョンをSDK 52と互換性のあるバージョンに修正。
  3. `rm -rf node_modules package-lock.json`で既存の依存関係を削除。
  4. `npm install`で再インストール。

#### 2. iOS実機ビルドでApple Developerアカウントがないとエラーになる

- **症状**: `eas build`コマンドでiOS向けビルドを行うと、有料のApple Developerアカウントがないためエラーになる。
- **解決策**: EASを使わず、ローカルのXcodeを使って実機ビルドを行います。

  1. **`ios`ディレクトリの生成**: 
     ```bash
     npx expo prebuild --platform ios
     ```
     **注意**: 古い`expo-cli`がグローバルにインストールされていると`prebuild`が失敗することがあります。必ず`npx`を付けてプロジェクトローカルの`expo`コマンドを実行してください。

  2. **Xcodeでの設定**:
     - `/ios/GrowLog.xcworkspace`をXcodeで開きます。
     - `Signing & Capabilities`タブで、`Team`に個人の無料Apple IDを設定します。

  3. **ビルドと実行**:
     - MacにiPhoneをUSB接続します。
     - Xcodeの実行ボタン（▶）を押して、アプリを実機にインストール・起動します。

### 3. Xcode Build Error: 'react/performance/timeline/PerformanceEntryReporter.h' file not found

- **症状**: Xcodeでのビルド中に `'react/performance/timeline/PerformanceEntryReporter.h' file not found` というエラーが発生する。
- **原因**: `expo-dev-client` のバージョンが Expo SDK と互換性がない可能性があります。
- **解決策**:
  1. `npx expo install expo-dev-client` を実行して、SDKに適合した最新バージョンをインストールします。
  2. これにより `package.json` が更新され、`expo-dev-client` が適切なバージョン（例: `~5.0.20`）になります。

### 4. Xcode Build Error: Build input files cannot be found

- **症状**: `pod install` 後、Xcodeでのビルド中に `Build input files cannot be found: ...` というエラーが発生する。
- **原因**: パッケージ更新後、iOSプロジェクトのファイル参照が古くなっている可能性があります。
- **解決策**:
  1. `ios` ディレクトリに移動します。
  2. `pod install` を実行して、iOSプロジェクトの依存関係を再インストールし、リンクを更新します。

## 参考リソース

- [Expo ドキュメント](https://docs.expo.dev/)
- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```# growlog
