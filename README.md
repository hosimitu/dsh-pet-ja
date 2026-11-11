# dsh-pet-ja 🐾🇯🇵

**DeepSeek Harness（DSH）のデスクトップペットプラグイン [dsh-pet](https://github.com/PC2005-cloud/dsh-pet) を日本語化した、非公式のフォークです。**

元プロジェクト: **https://github.com/PC2005-cloud/dsh-pet** （作者: [PC2005-cloud](https://github.com/PC2005-cloud)）
ベースバージョン: **dsh-pet 0.4.7**

> 本リポジトリは原作者・DeepSeek のいずれからも公認されたものではありません。非公式の二次創作物です。

---

## これは何か

[dsh-pet](https://github.com/PC2005-cloud/dsh-pet) は、DSH の画面に透明アニメーションのペットを住まわせるプラグインです。非常に完成度が高いのですが、UI の文言が中国語で統一されています（設定ページとチャットパネルは 8 言語対応、日本語も含まれます）。

本フォークは、**日本語ロケールでは日本語化されない部分**（右クリックメニュー、吹き出し、通知、コマンドなど）を日本語に置き換えたものです。

## 日本語化した範囲

| 対象 | 内容 |
|---|---|
| 右クリックメニュー | アクション / 表示位置 / 残高を見る / やること / ひとりごと / おしゃべり / 画像 / 寝る・起きる / 初期位置に戻る / その他 |
| メニュー内の分類 | 小ワザ / 遊び / 食べもの / 季節行事 / 文字もの、待機 / 方向転換 / ドラッグ / クリック反応 / 移動 |
| アニメーション名 | 114 種すべて（例: `悠闲哼歌` → `のんびり鼻歌`） |
| 表情画像名 | 27 種（例: `可爱` → `かわいい`） |
| 吹き出し | 作業ステータス 6 段階、寝る / 起きる / 拒否の台詞 |
| 残高バブル | 残高 / ピーク・オフピーク / 枠の使用率 / リセット済み / 今期 など |
| 待办リマインド | 「◯◯の時間だよ、忘れずにね」など |
| システム通知 | 会話が完了しました / 生成に失敗しました / 出力が打ち切られました / 権限を要求しています など |
| スラッシュコマンド | `/pet` `/chat` `/balance` の説明と結果メッセージ |
| 「白ごはん」機能 | 台詞プール 6 場面 × 3 句、トースト、エラー文 |

### 残っている中国語

以下は未対応です（いずれも画面に出ないか、異常時のみ表示されます）。

- 開発者向けのコンソールログ
- 一部のエラー・フォールバック文言
- 設定ページ内の未訳キー（上流の `zh` 辞書由来。日本語ロケールでは `ja` 辞書が優先されます）

## インストール

### 前提

- Node.js **22.12 以上**
- DSH **0.2.2-rc.1**（`dsh --version` で確認）
- Windows / macOS / Linux

### 手順

```sh
git clone https://github.com/hosimitu/dsh-pet-ja.git
cd dsh-pet-ja/dsh-pet

# 依存導入とビルド（lib/ はリポジトリに含まれないため必須）
npm install
npm run build
```

DSH のプロファイルへ導入します（`--profile` は使用中の環境に合わせてください）。

```sh
# ブラウザ版（dsh web）
dsh plugin --profile web add link:/path/to/dsh-pet-ja/dsh-pet

# デスクトップアプリ版
dsh plugin --profile desktop add link:/path/to/dsh-pet-ja/dsh-pet
```

導入後、**DSH を再起動**してください（ホスト側のコードはプロセスに常駐します）。

> `link:` の代わりに `file:` を使うと、パッケージがプロファイル配下へコピーされます。編集の反映を即座に試したい場合は `link:` が便利です。

### 元に戻す

```sh
dsh plugin --profile web add dsh-pet@0.4.7
```

## 設定

設定は上流と完全に同じです。`$DSH_HOME/dsh-pet/main-config.jsonc` を編集するか、DSH の「設定 → ペット設定」から変更します。

本フォークの日本語化では、**素材をユーザーディレクトリへ日本語名でコピーする方式**も併用しています（プラグインを更新しても日本語名が維持されます）。

```
$DSH_HOME/dsh-pet/
├─ main-config.jsonc              # animations / memes を日本語キーで記述
├─ main-animation/webm/*.webm     # 日本語ファイル名のアニメ素材（114 本）
└─ memes/*.png                    # 日本語ファイル名の表情画像（27 枚）
```

上流の詳しい設定項目は [CONFIG.md](CONFIG.md) を参照してください。

## 上流との差分

- `dsh-pet/src/**` の文字列を日本語化（17 ファイル / 約 90 箇所）
- それ以外のロジック・API・設定スキーマは上流と同一

差分は `git log -p` で確認できます。上流の README は [README.upstream.md](README.upstream.md) に保存してあります。

## ライセンス

本フォークは **2 種類のライセンス**が混在しています。利用前に必ずご確認ください。

### 1. コード — MIT

`LICENSE` を参照してください。著作権表示は原作者 **PC2005-cloud** に帰属します（`Copyright (c) 2026 PC2005-cloud`）。

本フォークの日本語化差分も MIT で提供します。

### 2. 素材（アニメーション・画像・プロンプト・キャラクター） — CC BY-NC-SA 4.0

ペットのキャラクター「大肥魚（鯨娘）」およびアニメーション素材は
**[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja)**（表示 · 非営利 · 継承）で提供されています。

- **非営利**：商用利用・販売はできません
- **表示**：原作者のクレジットと GitHub URL の明記が必要です
- **継承**：改変した素材を配布する場合も同じライセンスを適用する必要があります

原作者による二次創作の規定（[dsh-pet README](https://github.com/PC2005-cloud/dsh-pet) より）:

> 基于本项目的衍生 / 改版 / 换皮作品，在 GitHub 仓库、产品官网等公开渠道上须附上原作者 GitHub 地址：
> https://github.com/PC2005-cloud/dsh-pet

本リポジトリはこの規定に従い、原作者の GitHub URL を明記しています。

**キャラクターの出典**：DeepSeek「大肥魚（鯨娘）」はコミュニティによる二次創作であり、DeepSeek 公式のキャラクターではありません。原型「溟月」は Bilibili [@上善无形](https://space.bilibili.com/4456176)、DeepSeek 版（メイド鯨娘）のデザインは Bilibili [@ZipZipPipe](https://space.bilibili.com/4168597) によるものです。

### 3. 本フォークについて

- 非公式であり、原作者・DeepSeek による承認・保証はありません
- 不具合はまず本フォークの [Issues](https://github.com/hosimitu/dsh-pet-ja/issues) へ。上流固有の問題は [上流の Issues](https://github.com/PC2005-cloud/dsh-pet/issues) へお願いします

## 謝辞

- **[dsh-pet](https://github.com/PC2005-cloud/dsh-pet)** — PC2005-cloud 氏によるオリジナル実装。本フォークの土台です
- キャラクター原案・デザイン — [@上善无形](https://space.bilibili.com/4456176) / [@ZipZipPipe](https://space.bilibili.com/4168597)
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
