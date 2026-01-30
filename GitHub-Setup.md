# GitHub にアップロードする手順

## 📋 準備完了ファイル

以下のファイルがGitHubアップロード用に準備されています：

```
shopping-app-v5-fixed/
├── index.html          # メインページ
├── css/
│   └── style.css      # スタイルシート
├── js/
│   └── script.js      # JavaScript
├── README.md          # プロジェクト説明
├── .gitignore         # Git除外設定
└── GitHub-Setup.md    # このファイル
```

## 🚀 GitHub にアップロードする手順

### 1. GitHubでリポジトリ作成
1. [GitHub](https://github.com) にログイン
2. 右上の「+」→「New repository」
3. Repository name: `shopping-list-app` (お好みの名前)
4. Description: `即売会買い物管理アプリ`
5. Public を選択
6. 「Create repository」をクリック

### 2. ファイルをアップロード
**方法A: Web上でアップロード**
1. 「uploading an existing file」をクリック
2. `shopping-app-v5-fixed` フォルダ内の全ファイルをドラッグ&ドロップ
3. Commit message: `Initial commit - Shopping List App v5`
4. 「Commit changes」をクリック

**方法B: Git コマンド使用**
```bash
git clone https://github.com/ユーザー名/リポジトリ名.git
cd リポジトリ名
# shopping-app-v5-fixed の中身をコピー
git add .
git commit -m "Initial commit - Shopping List App v5"
git push origin main
```

### 3. GitHub Pages で公開
1. リポジトリの「Settings」タブ
2. 左メニューの「Pages」
3. Source: 「Deploy from a branch」
4. Branch: 「main」を選択
5. 「Save」をクリック

### 4. 公開URL確認
数分後に以下のURLでアクセス可能：
```
https://ユーザー名.github.io/リポジトリ名/
```

## 📱 使用方法

### スマホでの使用
1. 公開URLにアクセス
2. Safari/Chromeで開く
3. 「ホーム画面に追加」でアプリ化

### PCでの使用
1. 公開URLにアクセス
2. ブックマークに追加

## 🔧 カスタマイズ

### タイトル変更
`index.html` の以下を編集：
```html
<title>お買い物リスト v5</title>
<h1>お買い物リスト v5</h1>
```

### 色テーマ変更
`css/style.css` の以下を編集：
```css
header {
    background: #2196F3; /* ヘッダー色 */
}
```

## 📊 機能一覧

- ✅ スペースごとのグループ化
- ✅ 備考機能（赤字表示）
- ✅ 画像アップロード
- ✅ 地図機能
- ✅ データ保存・復元
- ✅ レスポンシブデザイン

## 🆘 トラブルシューティング

### GitHub Pages が表示されない
- 数分待ってから再度アクセス
- Settings > Pages で設定を確認

### スマホで動作しない
- HTTPS でアクセスしているか確認
- Safari/Chrome の最新版を使用

### データが消える
- 定期的にバックアップ機能を使用
- ブラウザのデータ削除に注意

お疲れ様でした！GitHub にアップロードして、世界中からアクセスできる買い物アプリの完成です！