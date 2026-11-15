/**
 * 斜杠命令 /pet：按 id 或名字切换当前桌宠。
 * @module dsh-pet/src/host/plugin/command-pet
 */
import type { BalancePoll } from './balance-poll.ts';
import type { ChatMemory } from './chat-memory.ts';
import type { HostContext } from './context.ts';

/** 桌宠选择命令的输入。 */
export type CommandPetInput = {
  /** 宿主上下文（apply 收到的那一个）。 */
  ctx: HostContext;
} & Pick<BalancePoll, 'effectivePetList'> &
  Pick<BalancePoll, 'petDisplayName'> &
  Pick<BalancePoll, 'resolveActivePetId'> &
  Pick<ChatMemory, 'setActivePetId'>;

/** 注册桌宠选择命令；返回的清理函数由 ctx.effect 收集。 */
export function registerPetCommand(deps: CommandPetInput): void {
  const { ctx, effectivePetList, petDisplayName, resolveActivePetId, setActivePetId } = deps;
  // /pet 斜杠命令：选择「当前桌宠」（/chat 对话的目标）。浏览器端另有 commandUi 装饰的选择框
  // （裸输 /pet 回车或菜单点选时弹出，选中后提交 /pet <id> 走同一 handler）；手输参数认 id 或名字
  // （name 可重复：唯一命中才认，重名报错列出候选 id）。
  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'pet',
        description: 'ペットを選択（/chat の相手。選択ボックスか id/名前の手入力）',
        input: { hint: '[ペットの id か名前]（空欄で現在のペットを表示）' },
        handler: ({ rawInput }: { rawInput: string }) => {
          const arg = rawInput.trim();
          let eff: Record<string, unknown>[];
          try {
            eff = effectivePetList();
          } catch {
            eff = [];
          }
          if (!arg) {
            const cur = resolveActivePetId();
            const found = eff.find((p) => String(p.id) === cur);
            return {
              kind: 'success',
              text: '現在のペット：' + (found ? petDisplayName(found) : cur || '（操作できるペットなし）'),
            };
          }
          const byId = eff.find((p) => String(p.id) === arg);
          if (byId) {
            setActivePetId(String(byId.id));
            return { kind: 'success', text: 'ペットを選択：' + petDisplayName(byId) };
          }
          const byName = eff.filter((p) => petDisplayName(p) === arg);
          if (byName.length === 1) {
            setActivePetId(String(byName[0].id));
            return { kind: 'success', text: 'ペットを選択：' + petDisplayName(byName[0]) };
          }
          if (byName.length > 1) {
            return {
              kind: 'error',
              text:
                '「' +
                arg +
                '」有 ' +
                byName.length +
                ' 只桌宠（id：' +
                byName.map((p) => String(p.id)).join('、') +
                '），请用 id 指定',
            };
          }
          return {
            kind: 'error',
            text: 'ペット「' + arg + '」は見つかりません（id か名前。/pet で選択ボックスが開きます）',
          };
        },
      }),
    'dsh-pet: /pet command',
  );
}
