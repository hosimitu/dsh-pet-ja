/**
 * 气泡文案表：工具名 → 一句话，命令名 → 一句话。
 *
 * 纯数据，不含判定；加工具或改语气只改这里。
 * 必须始终成立：每句都带具体对象，不说空话；不出现参数值（可能含 token 或内网地址）。
 * @module dsh-pet/src/host/tool-detail/copy
 */
import { fileTarget, filesTarget, firstStr, queryTarget, urlHost } from './target.ts';

/** 句子里可用的占位符：{target} 目标名、{cmd} 命令名。 */
export type CopyLine = string;

/** 从解析后的参数里取「目标」（文件名 / 搜索词 / 域名…）；取不到 → null。 */
type TargetPicker = (args: Record<string, unknown>) => string | null;

/** 只描述「怎么取目标」，不含任何文案（文案全部在下面的表里）。 */
export interface ToolRule {
  pick: TargetPicker;
  /**
   * 目标是不是路径：只有路径才做「太长只留文件名」的压缩。
   * 描述、搜索词、域名这类文本不该被 `/` 切开。
   */
  path?: boolean;
}

/** 文件名/图片类：每句都带 {target}。 */
const FILE_COPY: readonly CopyLine[] = [
  '{target} をぱらぱら見てみよう',
  '{target} には何が書いてあるのかな',
  'ちょっと {target} を覗いてみるね',
];

/** 写文件。 */
const WRITE_COPY: readonly CopyLine[] = [
  '{target} に何か書き込むね',
  '{target} をすぐ書き出すよ',
  '{target} にちょっと足すね',
];

/** 改文件。 */
const EDIT_COPY: readonly CopyLine[] = ['{target} を直さないとね', '{target} をいじるよ', '{target} のここを直すね'];

/** 找文件。 */
const GLOB_COPY: readonly CopyLine[] = [
  '{target} はどこに隠れてるのかな',
  '{target} があるか探してみる',
  '{target} はどこかな',
];

/** 搜内容。 */
const GREP_COPY: readonly CopyLine[] = ['{target} はどこかな', '{target} を探してみる', '{target} はどこにあるのかな'];

/** 给人看文件。 */
const PRESENT_COPY: readonly CopyLine[] = ['{target} を見せるね', '{target} を持ってきたよ', 'はい、{target} はこれ'];

/** 学技能。 */
const SKILL_COPY: readonly CopyLine[] = [
  '{target} という技を覚えるよ',
  '{target} のコツは覚えておくね',
  '{target} を身につけるよ',
];

/** 委派子任务。 */
const SUBAGENT_COPY: readonly CopyLine[] = [
  '助っ人を呼ぶよ：{target}',
  '助っ人に見てもらうね {target}',
  '{target} は助っ人に任せたよ',
];

/** 一个工具的文案：3 句带 {target} 的说法 + 目标太长时的一句纯氛围兜底。 */
export interface ToolCopy {
  readonly lines: readonly CopyLine[];
  /** 目标超过 TARGET_DISPLAY_MAX 时用：不出现文件名与工具名（气泡是氛围，不是信息面板） */
  readonly short: CopyLine;
}

/** 工具 → 文案。没列在这里的工具走 UNKNOWN_TOOL_LINE。 */
export const TOOL_COPY: Readonly<Record<string, ToolCopy>> = {
  read: { lines: FILE_COPY, short: 'コードをぱらぱら見る' },
  read_image: {
    lines: ['{target} ってどんな感じかな', '{target} を見せて', '{target} はどんな画像かな'],
    short: 'この画像は何かな',
  },
  write: { lines: WRITE_COPY, short: '何か書き込む' },
  edit: { lines: EDIT_COPY, short: 'ここを直すね' },
  str_replace_editor: { lines: EDIT_COPY, short: 'ここを直すね' },
  glob: { lines: GLOB_COPY, short: 'どこにあるか探す' },
  grep: { lines: GREP_COPY, short: 'あちこち探してみる' },
  present: { lines: PRESENT_COPY, short: '何か見せるね' },
  skill: { lines: SKILL_COPY, short: '新しい技を覚える' },
  subagent: { lines: SUBAGENT_COPY, short: '助っ人を呼ぶ' },
  subagent_fork: { lines: SUBAGENT_COPY, short: '助っ人を呼ぶ' },
  workflow: {
    lines: ['作業を並べて始めるよ', 'いくつかまとめて手配するね', '順番に一つずつやるよ'],
    short: '作業を並べる',
  },
  web_search: {
    lines: ['{target} を調べてくるね', '{target} は検索してみないとね', 'ネットで {target} を聞いてみる'],
    short: 'ネットで調べる',
  },
  web_fetch: {
    lines: ['{target} を見に行くね', '{target} のページをめくるよ', '{target} に何が書いてあるか見るね'],
    short: 'ネットを見に行く',
  },
};

/** 未知工具：只说一句氛围话，不报工具名（`str_replace_editor` 这种名字上屏很怪）。 */
export const UNKNOWN_TOOL_LINE: CopyLine = 'このツールは何だろう';

/** 兜底：没进表的命令（npm / python / node / tsc / eslint / docker…），短命令名会上屏。 */
export const COMMAND_FALLBACK: readonly CopyLine[] = [
  '{cmd} を実行してみるね',
  '{cmd} が動き出したよ',
  '{cmd} に働いてもらうね',
];

/** 兜底：命令名本身太长（如 Get-NetTCPConnection）时用，不带名字。 */
export const COMMAND_NAME_TOO_LONG: CopyLine = 'コマンドを実行するよ';

const CD_COPY: readonly CopyLine[] = ['まず場所を移動するね', 'そのディレクトリに移るよ', '場所を変えて続けるね'];

const LS_COPY: readonly CopyLine[] = ['ここに何があるか見るね', 'この階層の中身は何かな', 'ここにあるか見てみる'];

const CAT_COPY: readonly CopyLine[] = ['中身を見せて', '何が書いてあるか見るね', 'この内容を読むよ'];

const MKDIR_COPY: readonly CopyLine[] = ['新しいフォルダを作るね', '場所を空けるよ', '新しいディレクトリを切る'];

const RM_COPY: readonly CopyLine[] = ['いらないものを消すね', 'これは残さないよ', 'これを片づけるね'];

const MV_COPY: readonly CopyLine[] = ['場所を移すね', '置き場所を変えるよ', 'あっちへ移すね'];

const CP_COPY: readonly CopyLine[] = ['コピーを取っておくね', '予備に複製するよ', 'もう一部用意するね'];

const CURL_COPY: readonly CopyLine[] = [
  'API に問い合わせてみるね',
  'ノックして通じるか見るよ',
  'そのアドレスにリクエストするね',
];

const CHECKOUT_COPY: readonly CopyLine[] = [
  'そのブランチに切り替えるね',
  'ブランチを変えてみるよ',
  '別ルートで続けるね',
];

/** 命令 / 「命令 子命令」→ 3 句候选（键一律小写，别名共用同一组）。 */
export const COMMAND_COPY: Readonly<Record<string, readonly CopyLine[]>> = {
  cd: CD_COPY,
  'set-location': CD_COPY,
  ls: LS_COPY,
  dir: LS_COPY,
  'get-childitem': LS_COPY,
  cat: CAT_COPY,
  'get-content': CAT_COPY,
  mkdir: MKDIR_COPY,
  'new-item': MKDIR_COPY,
  rm: RM_COPY,
  del: RM_COPY,
  'remove-item': RM_COPY,
  mv: MV_COPY,
  'move-item': MV_COPY,
  cp: CP_COPY,
  'copy-item': CP_COPY,
  curl: CURL_COPY,
  'invoke-webrequest': CURL_COPY,

  // git：没命中子命令时用这一组
  git: ['git リポジトリをいじるね', 'git と格闘するよ', 'git まわりを触るね'],
  'git status': ['何が変わったか見るね', '作業ツリーがきれいか確認するよ', 'いまどうなってるかな'],
  'git diff': ['どこを変えたか見るね', 'どこを触ったのかな', '差分を見比べるよ'],
  'git log': ['コミット履歴を見せて', '最近のコミットをめくるよ', 'この数日の作業を見るね'],
  'git add': ['まずまとめておくね', 'いいものから片づけるよ', '変更を登録するね'],
  'git commit': ['コードは保存しないとね', 'コミットして記録するよ', 'まず保存しておくね'],
  'git push': ['そろそろ push するね', 'push は任せて', 'リモートに伝えるね'],
  'git pull': ['最新を pull するね', 'リモートの新しいのを持ってくるよ', 'まず同期するね'],
  'git fetch': ['リモートに新しいのがないか見るね', 'こっそりリモートを覗くよ', '最新状態を取ってくるね'],
  'git checkout': CHECKOUT_COPY,
  'git switch': CHECKOUT_COPY,
  'git branch': ['ブランチ一覧を見るね', 'ブランチを整理するよ', '新しいブランチを作っておくね'],
  'git merge': ['両方を合わせるね', 'マージするよ、喧嘩しないで', 'この2本を統合するね'],
  'git rebase': ['履歴を整え直すね', '順番を並べ直すよ', 'コミット順を整えるね'],
  'git stash': ['変更をいったんしまうね', 'これは横に置いておくよ', 'しばらく隠しておくね'],
  'git clone': ['リポジトリを丸ごと持ってくるね', 'そっくり写し取るよ', 'これを取ってきて見るね'],
  'git reset': ['さっきのを取り消すね', 'この数手を戻すよ', '前の状態に戻すね'],
  'git tag': ['これに印を付けるね', 'バージョンタグを貼るよ', 'マイルストーンを記録するね'],
};

/**
 * 语义已由别处表达、不该进气泡的工具：
 * `todo_write` 的文案本身就是气泡正文（写它等于自己盖自己）；`ask_user_question` 与 goal 系已有
 * 专门档位（waiting / success / error）；`exit_plan_mode` 是纯内部调度。
 * 这些报出来不是重复就是噪音。
 */
export const SILENT_TOOLS: ReadonlySet<string> = new Set([
  'todo_write',
  'ask_user_question',
  'create_goal',
  'get_goal',
  'update_goal',
  'exit_plan_mode',
]);

/** 取目标的方式（与文案表按工具名关联；pwsh 不在这里，它走命令表）。 */
export const TOOL_RULES: Readonly<Record<string, ToolRule>> = {
  read: { pick: fileTarget, path: true },
  read_image: { pick: fileTarget, path: true },
  write: { pick: fileTarget, path: true },
  edit: { pick: fileTarget, path: true },
  str_replace_editor: { pick: fileTarget, path: true },
  glob: { pick: (args) => firstStr(args, ['pattern', 'path']) },
  grep: { pick: (args) => firstStr(args, ['pattern', 'path']) },
  web_fetch: { pick: urlHost },
  web_search: { pick: queryTarget },
  subagent: { pick: (args) => firstStr(args, ['description']) },
  subagent_fork: { pick: (args) => firstStr(args, ['description']) },
  workflow: { pick: (args) => firstStr(args, ['name', 'description']) },
  skill: { pick: (args) => firstStr(args, ['name']) },
  present: { pick: filesTarget, path: true },
};
