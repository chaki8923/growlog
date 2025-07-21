# GrowLog Design System v2.0.1

## 🎯 Design Philosophy

**"AI-Powered Terminal Aesthetic for Growth Tracking"**

GrowLogは、最先端のAI技術とクラシックなターミナル/CLI（Command Line Interface）の美学を融合させた成長記録アプリです。ソフトウェアエンジニアをはじめとする技術者に愛される、プロフェッショナルで未来的なユーザーインターフェースを提供します。

---

## 🎨 Core Design Principles

### 1. **Terminal-Inspired Interface**
- **MacOS風ターミナルウィンドウ**: 赤・黄・緑の3色ボタンとタイトルバー
- **コマンドライン風の操作感**: プロンプト記号（`$`）と実行可能コマンド表示
- **システムログ風メッセージ**: `[INFO]`, `[WARN]`, `[ERROR]` 形式の情報表示

### 2. **AI & Future-Tech Aesthetic**
- **システム状態表示**: `CRITICAL`, `ERROR`, `WARNING`, `SUCCESS`, `OPTIMAL`
- **バージョン管理風命名**: `growth-tracker v2.0.1`, `growth-history v2.0.1`
- **暗号化・セキュリティ要素**: `AES-256 Encryption`, `Connected to growth.ai`

### 3. **Dark-First Color Palette**
- **GitHub Dark**をベースとした統一カラーシステム
- 技術者に馴染み深い配色で目の疲労を軽減
- 高いコントラスト比でアクセシビリティを確保

---

## 🌈 Color System

### Primary Colors
```css
--background-primary: #0d1117    /* GitHub Dark Background */
--background-secondary: #161b22  /* Card/Terminal Background */
--background-tertiary: #21262d   /* Header Background */
--border-primary: #30363d        /* Default Border */
```

### Semantic Colors
```css
--success: #0be881      /* Achievements, Success State */
--info: #58a6ff         /* Links, Primary Actions */
--warning: #feca57      /* Warning State */
--error: #ff6b6b        /* Error State, Critical */
--critical: #ff9f43     /* Error State */
```

### Text Colors
```css
--text-primary: #f0f6fc    /* Primary Text */
--text-secondary: #8b949e  /* Secondary Text, Labels */
--text-accent: #7c3aed     /* System Messages */
--text-prompt: #0be881     /* Terminal Prompt */
--text-command: #58a6ff    /* Command Text */
```

---

## 🔤 Typography

### Font Stack
```css
--font-mono: 'monospace'  /* システム標準のモノスペースフォント */
```

### Typography Scale
- **Terminal Title**: 12px, monospace, #8b949e
- **Command Text**: 14px, monospace, #58a6ff
- **System Info**: 12px, monospace, #7c3aed
- **Body Text**: 14px, monospace, #f0f6fc
- **Labels**: 12px, monospace, #8b949e
- **Headers**: 18px, monospace, #58a6ff

---

## 🎯 Icon System

### Icon Library
**Feather Icons** - シンプルで一貫性のあるラインアイコン

### Core Icons
```javascript
// Navigation & Actions
edit-3          // テキスト入力、編集
message-circle  // 思考、コメント
target          // 成功、達成
activity        // 状態、気分
calendar        // 日付
database        // データ

// System Status
wifi            // 接続状態
shield          // セキュリティ
trending-up     // 成長、進歩
cloud-upload    // 同期、保存
sync            // 更新、同期中
```

### Icon Guidelines
- **サイズ**: 10px〜16px（コンテキストに応じて）
- **色**: セマンティック色またはセカンダリテキスト色
- **用途**: 情報の視覚的分類とアクション識別

---

## 🖥️ Component Architecture

### Terminal Window
```
┌─ ● ● ● ─ application-name v2.0.1 ─────────┐
│ user@growlog:~$ ./command --flags         │
│ [INFO] System status message             │
│ [INFO] Additional information            │
└───────────────────────────────────────────┘
```

### Command Structure
```bash
# 成長記録
./capture_growth --date YYYY-MM-DD
./sync_to_cloud --encrypt

# 履歴表示
./list_records --format timeline --limit 100
```

### Status Indicators
```
STATUS: OPTIMAL     # 気分評価: 5
STATUS: SUCCESS     # 気分評価: 4  
STATUS: WARNING     # 気分評価: 3
STATUS: ERROR       # 気分評価: 2
STATUS: CRITICAL    # 気分評価: 1
```

---

## 📱 Layout Principles

### 1. **Information Hierarchy**
- ターミナルヘッダーで現在のコンテキスト表示
- システムメッセージで状態を明確化
- データカードで構造化された情報表示

### 2. **Spacing System**
```css
--space-xs: 4px    /* アイコン間隔 */
--space-sm: 8px    /* 小要素間隔 */
--space-md: 12px   /* 標準間隔 */
--space-lg: 16px   /* セクション間隔 */
--space-xl: 24px   /* コンポーネント間隔 */
```

### 3. **Border Radius**
```css
--radius-sm: 4px   /* ボタン、小要素 */
--radius-md: 6px   /* 標準要素 */
--radius-lg: 8px   /* カード、ターミナル */
```

---

## 🚀 Implementation Guidelines

### Do's ✅
- モノスペースフォントを一貫して使用
- CLI風のラベリング（`--flags`形式）
- システムログ風メッセージの活用
- ダークテーマの維持
- Featherアイコンの統一使用

### Don'ts ❌
- 絵文字の使用（ターミナル感を損なう）
- 明るい背景色の使用
- サンセリフフォントの混在
- カラフルすぎる装飾
- 複雑なアニメーション

---

## 📊 User Experience Goals

### Target Persona
- **Software Engineers**: CLI/ターミナルに慣れ親しんだ技術者
- **Tech Enthusiasts**: 最新技術とプロフェッショナルツールを好む層
- **Growth Hackers**: 効率的な自己改善を追求する人々

### Emotional Response
- **Trust**: 暗号化・セキュリティ表示による安心感
- **Efficiency**: 無駄のないインターフェースによる快適性
- **Expertise**: プロフェッショナルツール感による満足感
- **Innovation**: AI・最先端技術への期待感

---

## 🔧 Technical Specifications

### React Native Implementation
```javascript
// Color constants
const Colors = {
  background: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  primary: '#58a6ff',
  success: '#0be881',
  // ...
};

// Typography
const Typography = {
  mono: { fontFamily: 'monospace' },
  sizes: {
    xs: 11,
    sm: 12, 
    md: 14,
    lg: 16,
    xl: 18,
  },
};
```

### Icon Integration
```javascript
import { Feather } from '@expo/vector-icons';

// Usage
<Feather name="edit-3" size={16} color="#58a6ff" />
```

---

## 📈 Future Enhancements

### Planned Features
- **Theme Variations**: Light mode（技術文書風）
- **Custom Fonts**: JetBrains Mono等のプログラミング用フォント
- **Animation System**: ターミナル風のタイピングアニメーション
- **Sound Effects**: キーボード音、ビープ音等の効果音

### Accessibility Considerations
- **高コントラスト**: WCAG AA準拠
- **スクリーンリーダー**: モノスペースフォントの読み上げ対応
- **キーボードナビゲーション**: CLI風ショートカット

---

## 📝 Version History

- **v2.0.1**: Initial CLI/Terminal design system
- **v2.0.0**: AI-powered interface foundation
- **v1.0.0**: Basic growth tracking functionality

---

*Design System maintained by GrowLog Development Team*  
*Last updated: 2024* 