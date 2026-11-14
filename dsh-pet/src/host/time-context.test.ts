/**
 * 时间背景单元测试 —— 钉住注入 system 末尾的那一行文字：
 *  - 时段 0–23 逐时映射（未明 0-4 / 早朝 5-6 / 朝 7-8 / 午前 9-10 / 昼 11-12 / 午後 13-16 / 夕方 17-18 /
 *    夜 19-22 / 深夜 23），分钟边界不越档（04:59 仍未明、05:00 进早朝）；
 *  - 整行 = 不补零月日 + 补零时分 + 星期 + 时段 + 週末/平日（周六周日，与余额低谷同口径）+ 可选节日从句 + 克制的引导语；
 *  - 节日从句：节前「快要过X了」/「明天就是X」、当天「今天是X」、节期内「还在X假期里」/「X假期最后一天了」、
 *    节后「X刚过完」/「X这么快就过完了」，各按自己的 span / after；
 *  - 长度：元旦/端午/清明/劳动节/中秋各 3 天、国庆 7 天、春节 15 天（除夕→正月十五），寒假 30 天、暑假 60 天；
 *  - 一天命中多个节日时按 PRIORITY 数组顺序取靠前者：2/14、2/16 除夕、3/3 元宵、4/1、5/4、7/1 暑假、8/19 七夕、
 *    12/31 跨年夜均有用例；农历按 ICU 换算，闰月不误判（2028 闰五月初五非端午）；
 *  - 非法 Date → 空串（绝不产出「NaN年NaN月」）；日期用 `new Date(y, m, d, h, min)` 本地时间构造，断言不随运行机器时区变化。
 *  - ICU 降级分支未覆盖（需替换全局 Intl，会干扰其它用例）；跑法：node --experimental-strip-types --test src/host/time-context.test.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { dayKindOf, historyStampOf, timeContextOf, timeSlotOf, type TimeSlot } from './time-context.ts';

/** 0–23 点逐时期望时段（改划分口径时必须同步这里，否则测试红） */
const EXPECTED_BY_HOUR: TimeSlot[] = [
  '未明',
  '未明',
  '未明',
  '未明',
  '未明',
  '早朝',
  '早朝',
  '朝',
  '朝',
  '午前',
  '午前',
  '昼',
  '昼',
  '午後',
  '午後',
  '午後',
  '午後',
  '夕方',
  '夕方',
  '夜',
  '夜',
  '夜',
  '夜',
  '深夜',
];

/** 注入文本的固定尾巴（引导语）——主张克制，避免模型句句都提时间/节日 */
const TAIL =
  '。これは背景情報で、わざわざ時刻を告げる必要はないし、毎回のように祝日に触れる必要もない——ふだんは普通に話し、本当に合うときだけ自然に一言添える程度でよい。';

/** 断言注入文本含指定节日从句（从句在整行里以「，…。」出现） */
function assertClause(date: Date, clause: string): void {
  const text = timeContextOf(date);
  assert.ok(text.includes('，' + clause + '。'), `${date.toDateString()} 期望含「${clause}」，实际：${text}`);
}

/** 断言该日期没有任何节日从句（平日/週末后直接接句号 + 引导语） */
function assertNoClause(date: Date): void {
  assert.match(timeContextOf(date), /(平日|週末)。これは背景情報/);
}

describe('timeSlotOf —— 小时 → 时段', () => {
  test('0–23 点逐时映射（钉死全部档位边界）', () => {
    const actual = Array.from({ length: 24 }, (_, h) => timeSlotOf(h));
    assert.deepEqual(actual, EXPECTED_BY_HOUR);
  });

  test('越界 / NaN → 未明兜底（不抛错，提示词路径不能因时间格式失败）', () => {
    assert.equal(timeSlotOf(-1), '未明');
    assert.equal(timeSlotOf(24), '深夜');
    assert.equal(timeSlotOf(Number.NaN), '未明');
  });
});

describe('dayKindOf —— 星期 → 平日 / 週末', () => {
  test('周六（6）/ 周日（0）= 週末，周一至周五 = 平日', () => {
    assert.equal(dayKindOf(0), '週末');
    assert.equal(dayKindOf(6), '週末');
    for (const day of [1, 2, 3, 4, 5]) {
      assert.equal(dayKindOf(day), '平日');
    }
  });
});

describe('timeContextOf —— 整行格式（无节日）', () => {
  test('无节日时是完整的一行，且不含节日从句', () => {
    assert.equal(
      timeContextOf(new Date(2026, 4, 12, 15, 4)),
      '【現在】いまは2026年5月12日火曜日 15:04，午後，平日' + TAIL,
    );
  });

  test('时分补零、月日不补零', () => {
    assert.equal(
      timeContextOf(new Date(2026, 5, 5, 9, 7)),
      '【現在】いまは2026年6月5日金曜日 09:07，午前，平日' + TAIL,
    );
  });

  test('周六算週末', () => {
    assert.equal(
      timeContextOf(new Date(2026, 4, 9, 23, 59)),
      '【現在】いまは2026年5月9日土曜日 23:59，深夜，週末' + TAIL,
    );
  });

  test('周日算週末、整点分钟补零', () => {
    assert.equal(
      timeContextOf(new Date(2026, 4, 10, 5, 0)),
      '【現在】いまは2026年5月10日日曜日 05:00，早朝，週末' + TAIL,
    );
  });

  test('引导语克制：明确要求不必报时、别句句都提节日', () => {
    const text = timeContextOf(new Date(2026, 4, 12, 15, 4));
    assert.ok(text.includes('わざわざ時刻を告げる必要はない'));
    assert.ok(text.includes('毎回のように祝日に触れる必要もない'));
  });

  test('分钟边界不越档：04:59 仍是未明、05:00 已进早朝', () => {
    assert.ok(timeContextOf(new Date(2026, 4, 12, 4, 59)).includes('，未明，平日'));
    assert.ok(timeContextOf(new Date(2026, 4, 12, 5, 0)).includes('，早朝，平日'));
  });

  test('分钟边界不越档：22:59 仍是夜、23:00 已进深夜', () => {
    assert.ok(timeContextOf(new Date(2026, 4, 12, 22, 59)).includes('，夜，平日'));
    assert.ok(timeContextOf(new Date(2026, 4, 12, 23, 0)).includes('，深夜，平日'));
  });

  test('非法 Date → 空串（整行不加，不产出 NaN 乱码）', () => {
    assert.equal(timeContextOf(new Date('not a date')), '');
  });
});

describe('节日 —— 单日节日（span = 1）', () => {
  test('当天：今天是国庆节', () => {
    assertClause(new Date(2026, 9, 1, 12, 0), '今日は国慶節');
  });

  test('当天用口语名：元旦说「新年第一天」', () => {
    assertClause(new Date(2026, 0, 1, 8, 0), '今日は新年最初の日');
  });

  test('跨年夜：排在元旦之前，12/31 说跨年夜而不是「明天就是元旦」', () => {
    assertClause(new Date(2025, 11, 31, 20, 0), '今日は大晦日');
  });

  test('平安夜排在圣诞节之前且不留回味：12/24 说平安夜、12/25 说圣诞节', () => {
    assertClause(new Date(2025, 11, 24, 20, 0), '今日はクリスマスイブ');
    assertClause(new Date(2025, 11, 25, 20, 0), '今日はクリスマス');
  });

  test('节前 +3 / +2 天：快要过儿童节了', () => {
    assertClause(new Date(2026, 4, 29, 10, 0), 'こどもの日が近いよ');
    assertClause(new Date(2026, 4, 30, 10, 0), 'こどもの日が近いよ');
  });

  test('节前 +1 天：明天就是儿童节', () => {
    assertClause(new Date(2026, 4, 31, 10, 0), '明日はこどもの日');
  });

  test('节后第 1 / 2 天：儿童节刚过完', () => {
    assertClause(new Date(2026, 5, 2, 10, 0), 'こどもの日が終わったばかり');
    assertClause(new Date(2026, 5, 3, 10, 0), 'こどもの日が終わったばかり');
  });

  test('节后第 3 天：儿童节这么快就过完了', () => {
    assertClause(new Date(2026, 5, 4, 10, 0), 'こどもの日があっという間に終わった');
  });

  test('窗口外（前后第 4 天）不注入节日', () => {
    assertNoClause(new Date(2026, 4, 28, 10, 0));
    assertNoClause(new Date(2026, 5, 5, 10, 0));
  });
});

describe('节日 —— 长度个性化（span > 1，长假分三段）', () => {
  test('国庆 7 天：开始 → 假期中 → 最后一天 → 回味', () => {
    assertClause(new Date(2026, 9, 1, 10, 0), '今日は国慶節');
    assertClause(new Date(2026, 9, 5, 10, 0), '国慶節の期間中');
    assertClause(new Date(2026, 9, 7, 10, 0), '国慶節の最終日');
    assertClause(new Date(2026, 9, 8, 10, 0), '国慶節が終わったばかり');
    assertClause(new Date(2026, 9, 10, 10, 0), '国慶節があっという間に終わった');
    assertNoClause(new Date(2026, 9, 11, 10, 0));
  });

  test('元旦 3 天：假期中 → 最后一天 → 回味', () => {
    assertClause(new Date(2026, 0, 2, 10, 0), '元日の期間中');
    assertClause(new Date(2026, 0, 3, 10, 0), '元日の最終日');
    assertClause(new Date(2026, 0, 4, 10, 0), '元日が終わったばかり');
  });

  test('清明 3 天（大致 4/4 起）：愚人节次日才开始预热', () => {
    assertNoClause(new Date(2026, 3, 2, 10, 0));
    assertClause(new Date(2026, 3, 3, 10, 0), '明日は清明節');
    assertClause(new Date(2026, 3, 4, 10, 0), '今日は清明節');
    assertClause(new Date(2026, 3, 6, 10, 0), '清明節の最終日');
    assertClause(new Date(2026, 3, 7, 10, 0), '清明節が終わったばかり');
  });

  test('劳动节 3 天与青年节让位：5/4 说青年节、5/5 再说劳动节', () => {
    assertClause(new Date(2026, 4, 1, 10, 0), '今日は労働者の日');
    assertClause(new Date(2026, 4, 3, 10, 0), '労働者の日の最終日');
    assertClause(new Date(2026, 4, 4, 10, 0), '今日は青年の日');
    assertClause(new Date(2026, 4, 5, 10, 0), '労働者の日が終わったばかり');
  });

  test('中秋 3 天：假期中与最后一天', () => {
    assertClause(new Date(2026, 8, 25, 10, 0), '今日は中秋節');
    assertClause(new Date(2026, 8, 26, 10, 0), '中秋節の期間中');
    assertClause(new Date(2026, 8, 27, 10, 0), '中秋節の最終日');
    // 中秋 after 只有 2 天，但优先级高于国庆：9/28 仍说中秋，9/30 才轮到国庆前夜
    assertClause(new Date(2026, 8, 28, 10, 0), '中秋節が終わったばかり');
    assertClause(new Date(2026, 8, 30, 10, 0), '明日は国慶節');
  });

  test('中秋 after=2：回味窗口到第 2 天为止（2027 验证）', () => {
    assertClause(new Date(2027, 8, 17, 10, 0), '中秋節の最終日');
    assertClause(new Date(2027, 8, 18, 10, 0), '中秋節が終わったばかり');
    assertClause(new Date(2027, 8, 19, 10, 0), '中秋節が終わったばかり');
    assertNoClause(new Date(2027, 8, 20, 10, 0));
  });

  test('春节 15 天（正月初一 → 正月十五）：整段都在年味里', () => {
    assertClause(new Date(2026, 1, 17, 10, 0), '今日は旧暦の元日');
    assertClause(new Date(2026, 1, 20, 10, 0), '春節の期間中');
  });

  test('节前与当天压过「假期中」：3/2 说明天就是元宵节，3/3 是元宵节当天', () => {
    assertClause(new Date(2026, 2, 2, 10, 0), '明日は元宵節');
    assertClause(new Date(2026, 2, 3, 10, 0), '今日は元宵節');
  });

  test('元宵排在春节之前：元宵的当天与回味都归元宵', () => {
    assertClause(new Date(2026, 2, 4, 10, 0), '元宵節が終わったばかり');
    assertClause(new Date(2026, 2, 5, 10, 0), '元宵節が終わったばかり');
    assertClause(new Date(2026, 2, 7, 10, 0), '明日は女性の日');
  });
});

describe('节日 —— 农历（ICU 换算）', () => {
  test('除夕：腊月最后一天（2026 是腊月廿九，不是三十）', () => {
    assertClause(new Date(2026, 1, 16, 12, 0), '今日は旧暦の大晦日');
  });

  test('除夕 ahead=1：2/14 不说除夕，说情人节', () => {
    assertClause(new Date(2026, 1, 14, 12, 0), '今日はバレンタインデー');
  });

  test('元宵节', () => {
    assertClause(new Date(2026, 2, 3, 12, 0), '今日は元宵節');
  });

  test('端午节（3 天假）', () => {
    assertClause(new Date(2026, 5, 19, 12, 0), '今日は端午の節句');
    assertClause(new Date(2026, 5, 21, 12, 0), '端午の節句の最終日');
  });

  test('中秋节', () => {
    assertClause(new Date(2026, 8, 25, 12, 0), '今日は中秋節');
  });

  test('腊八节（公历 1 月，农历还在上一年，且在寒假里照常说）', () => {
    assertClause(new Date(2026, 0, 26, 12, 0), '今日は臘八節');
  });

  test('七夕（落在暑假里也要说节日，不被假期压掉）', () => {
    assertClause(new Date(2026, 7, 19, 12, 0), '今日は七夕');
  });

  test('闰月不误判：2028 闰五月初五不是端午，真端午在 2028-05-28', () => {
    assertClause(new Date(2028, 4, 28, 12, 0), '今日は端午の節句');
    assertNoClause(new Date(2028, 5, 27, 12, 0)); // 闰五月初五：月为负，不参与匹配
  });
});

describe('假期区间 —— 寒假 30 天 / 暑假 60 天', () => {
  test('寒假：预热 → 开始 → 假期中', () => {
    assertClause(new Date(2026, 0, 17, 10, 0), '冬休みが近いよ');
    assertClause(new Date(2026, 0, 19, 10, 0), '明日から冬休み');
    assertClause(new Date(2026, 0, 20, 10, 0), '冬休みが始まった');
    assertClause(new Date(2026, 1, 5, 10, 0), '冬休みの期間中');
  });

  test('寒假末尾（用 2028：2026 的这几天被春节占了）', () => {
    assertClause(new Date(2028, 1, 18, 10, 0), '冬休みがもうすぐ終わる');
    assertClause(new Date(2028, 1, 19, 10, 0), '冬休みが終わったばかり');
    assertClause(new Date(2028, 1, 21, 10, 0), '冬休みがあっという間に終わった');
    assertNoClause(new Date(2028, 1, 22, 10, 0));
  });

  test('暑假：预热 → 首日 → 假期中', () => {
    // 暑假排在建党节之前：7/1 说「暑假开始了」，不再被建党节压掉
    assertClause(new Date(2026, 5, 28, 10, 0), '夏休みが近いよ');
    assertClause(new Date(2026, 5, 30, 10, 0), '明日から夏休み');
    assertClause(new Date(2026, 6, 1, 10, 0), '夏休みが始まった');
    assertClause(new Date(2026, 6, 15, 10, 0), '夏休みの期間中');
  });

  test('暑假末尾：中元节优先，随后是暑假的收尾', () => {
    assertClause(new Date(2026, 7, 27, 10, 0), '今日はお盆');
    assertClause(new Date(2026, 7, 28, 10, 0), 'お盆が終わったばかり');
    assertClause(new Date(2026, 7, 31, 10, 0), '夏休みが終わったばかり');
    assertClause(new Date(2026, 8, 1, 10, 0), '夏休みがあっという間に終わった');
    assertNoClause(new Date(2026, 8, 2, 10, 0));
  });
});

describe('节日 —— 优先级＝数组顺序（靠前的先说话）', () => {
  test('当天压过节前：2026-02-14 是情人节（春节还差 3 天）', () => {
    assertClause(new Date(2026, 1, 14, 12, 0), '今日はバレンタインデー');
  });

  test('节前压过节后：2026-02-15 说「明天就是除夕」', () => {
    assertClause(new Date(2026, 1, 15, 12, 0), '明日は旧暦の大晦日');
  });

  test('除夕排在春节之前：2026-02-16 说除夕，而非「明天就是春节」', () => {
    assertClause(new Date(2026, 1, 16, 12, 0), '今日は旧暦の大晦日');
  });

  test('愚人节排在清明之前：2026-04-01 说愚人节', () => {
    assertClause(new Date(2026, 3, 1, 12, 0), '今日はエイプリルフール');
  });

  test('春节压过寒假：寒假期间仍由春节说话', () => {
    assertClause(new Date(2026, 1, 18, 12, 0), '春節の期間中');
  });

  test('传统节日压过暑假：8/19 七夕当天说七夕', () => {
    assertClause(new Date(2026, 7, 19, 12, 0), '今日は七夕');
  });

  test('暑假压过纪念日：7/1 既是建党节又是暑假首日，说暑假', () => {
    assertClause(new Date(2026, 6, 1, 12, 0), '夏休みが始まった');
  });
});

describe('historyStampOf —— 历史消息的时间前缀', () => {
  test('同年：月日不补零、时分补零', () => {
    const at = new Date(2026, 9, 31, 22, 53).getTime();
    assert.equal(historyStampOf(at, new Date(2026, 10, 2, 0, 52)), '10月31日 22:53');
  });

  test('个位数时/分补零：09:05 不能写成 9:5', () => {
    const at = new Date(2026, 10, 2, 9, 5).getTime();
    assert.equal(historyStampOf(at, new Date(2026, 10, 2, 9, 5)), '11月2日 09:05');
  });

  test('跨年：带上年份，消掉“哪一年”的歧义', () => {
    const at = new Date(2025, 11, 31, 23, 59).getTime();
    assert.equal(historyStampOf(at, new Date(2026, 0, 1, 0, 30)), '2025年12月31日 23:59');
  });

  test('ts 非法（NaN / 越界）→ 空串，调用方据此不发前缀', () => {
    assert.equal(historyStampOf(Number.NaN, new Date(2026, 10, 2)), '');
    assert.equal(historyStampOf(Number.POSITIVE_INFINITY, new Date(2026, 10, 2)), '');
  });

  test('now 非法 → 空串（没有“现在”就无法判断是否跨年）', () => {
    assert.equal(historyStampOf(new Date(2026, 9, 31).getTime(), new Date('nope')), '');
  });
});

describe('timeContextOf —— 环境行（城市与天气）', () => {
  /** 2026-11-11 星期三 20:50：平日 + 夜，落在断言的稳定区间里 */
  const EVENING = new Date(2026, 10, 11, 20, 50);
  const WEATHER = { summary: '曇り', temperatureC: 13.1, apparentC: 12.9, humidityPercent: 84, windKph: 2 };

  test('不传 env：不带地点、不带天气，句尾也不提天气', () => {
    const text = timeContextOf(EVENING);
    assert.ok(!text.includes('あなたは'), '不该出现地点');
    assert.ok(!text.includes('外は'), '不该出现天气');
    assert.ok(text.endsWith('——ふだんは普通に話し、本当に合うときだけ自然に一言添える程度でよい。'));
  });

  test('只给城市：地点在最前，没有天气就写“没查到”的交代', () => {
    const text = timeContextOf(EVENING, { city: '南昌市' });
    assert.ok(text.startsWith('【現在】あなたは南昌市にいる（ネット経由の概算なので不正確かもしれない）。いまは'));
    assert.ok(
      text.includes('平日，外の天気は今回は取得できなかった。聞かれたら分からないと言い、作り話はしない。'),
      `实际：${text}`,
    );
    assert.ok(text.includes('や天気'));
  });

  test('省 + 市：连写成“江西省南昌市”', () => {
    const text = timeContextOf(EVENING, { region: '江西省', city: '南昌市' });
    assert.ok(
      text.startsWith('【現在】あなたは江西省南昌市にいる（ネット経由の概算なので不正確かもしれない）。いまは'),
      `实际：${text}`,
    );
  });

  test('省市互相包含：只留带后缀的那个，不写成“北京市北京”', () => {
    const text = timeContextOf(EVENING, { region: '北京市', city: '北京' });
    assert.ok(
      text.startsWith('【現在】あなたは北京市にいる（ネット経由の概算なので不正確かもしれない）。いまは'),
      `实际：${text}`,
    );
  });

  test('拉丁文地名之间补一个空格', () => {
    const text = timeContextOf(EVENING, { region: 'Jiangxi', city: 'Nanchang' });
    assert.ok(
      text.startsWith('【現在】あなたはJiangxi Nanchangにいる（ネット経由の概算なので不正確かもしれない）。いまは'),
      `实际：${text}`,
    );
  });

  test('城市与天气都有：天气接在工作日后面', () => {
    const text = timeContextOf(EVENING, { region: '江西省', city: '南昌市', weather: WEATHER });
    assert.ok(text.includes('平日，外は曇り、気温 13.1°C、体感 12.9°C、湿度 84%、風速 2 km/h。'), `实际：${text}`);
  });

  test('只有天气没有城市：省掉“你在……”，天气照写', () => {
    const text = timeContextOf(EVENING, { weather: WEATHER });
    assert.ok(!text.includes('あなたは'));
    assert.ok(text.includes('平日，外は曇り、気温 13.1°C'));
  });

  test('整数气温不带小数点', () => {
    const text = timeContextOf(EVENING, { weather: { ...WEATHER, temperatureC: 20, apparentC: 20 } });
    assert.ok(text.includes('気温 20°C、体感 20°C'), `实际：${text}`);
  });

  test('非法 Date 且给了 env：仍返回空串', () => {
    assert.equal(timeContextOf(new Date('nope'), { city: '南昌市' }), '');
  });
});
