<script setup lang="ts">
// ============================================================
// /daily — 1 週間ワーク（Step 7）
//   - 参加者識別はクッキー（reroots-token）。URL にトークンを含まない。
//   - Step 6 完了日（step6CompletedAt）の翌日が Day 1。
//   - Day 1〜Day 7 の記録を、過去日も含めて一覧表示・編集できる。
// ============================================================
import { CONTENT } from "~/content/assessment";
import type { Step7Record } from "~/types/database.types";

definePageMeta({ layout: false });

const {
  state,
  mutate,
  load,
  flush,
  setToken,
  loadTokenFromCookie,
  notFound,
  saving,
  submitted,
} = useAssessmentState();

// ---- トークン取得 + データロード ----
const cookieToken = loadTokenFromCookie();
const tokenMissing = ref(!cookieToken);
if (cookieToken) {
  setToken(cookieToken);
  await load();
}

// ---- 日付ユーティリティ ----
// YYYY-MM-DD 形式に整形
const isoDay = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const todayDate = computed(() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
});
const todayStr = computed(() => isoDay(todayDate.value));

// step6CompletedAt は ISO 文字列（YYYY-MM-DD）想定。
// 後方互換として ISO datetime 文字列も許容。
const step6Date = computed(() => {
  const raw = state.value.step6CompletedAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
});

// Day 番号：step6CompletedAt の翌日 = Day 1
//   - Step 6 完了日（diff = 0）でも全 Day を編集可能にするため、null を返さず 0 を返す
//   - Day 1〜7 はそのまま
//   - Day 8+（diff > 7）= 1 週間ワーク完了済み
const todayDayNumber = computed<number>(() => {
  if (!step6Date.value) return 0;
  const diff = Math.floor(
    (todayDate.value.getTime() - step6Date.value.getTime()) / 86400000,
  );
  return Math.max(0, diff);
});

const isWorkComplete = computed(() => todayDayNumber.value >= 8);

const allDays = computed(() => {
  if (!step6Date.value) return [] as { dayNumber: number; date: string }[];
  return Array.from({ length: 7 }, (_, i) => {
    const dayNumber = i + 1;
    const d = new Date(step6Date.value!);
    d.setDate(d.getDate() + dayNumber);
    return { dayNumber, date: isoDay(d) };
  });
});

// ---- 編集中の Day ----
// デフォルトは today の Day（あれば）、なければ最後に編集可能な過去 Day
const editingDay = ref<number | null>(null);

onMounted(() => {
  if (editingDay.value !== null) return;
  const t = todayDayNumber.value;
  if (t >= 1 && t <= 7) {
    editingDay.value = t;
  } else if (t === 0) {
    // 完了当日（プレビュー）：Day 1 をデフォルト編集対象に
    editingDay.value = 1;
  } else {
    // Day 8 以降（1 週間経過後）：未記入の最初の Day、なければ Day 7
    // 過去日も含めていつでも編集できる（/review 提出後も同様）。
    const firstEmpty = allDays.value.find((d) => !recordOf(d.dayNumber));
    editingDay.value = firstEmpty?.dayNumber ?? 7;
  }
});

const recordOf = (dayNumber: number): Step7Record | null => {
  return (
    state.value.step7.records.find((r) => r.dayNumber === dayNumber) ?? null
  );
};

const getOrCreateRecord = (dayNumber: number): Step7Record => {
  const existing = recordOf(dayNumber);
  if (existing) return existing;
  const day = allDays.value.find((d) => d.dayNumber === dayNumber);
  const fresh: Step7Record = {
    dayNumber,
    targetDate: day?.date ?? todayStr.value,
    q1TodayAchieved: "",
    q1NoneFlag: false,
    q2FuturePossible: "",
    q3TomorrowGoal: "",
    firstSubmittedAt: null,
    lastUpdatedAt: null,
  };
  mutate((s) => {
    s.step7.records.push({ ...fresh });
  });
  return state.value.step7.records.find((r) => r.dayNumber === dayNumber)!;
};

// 編集対象の Day レコードを「参照渡し」のような形で取得
const currentRecord = computed<Step7Record | null>(() => {
  if (editingDay.value == null) return null;
  return recordOf(editingDay.value);
});

const ensureCurrentExists = () => {
  if (editingDay.value == null) return;
  if (!currentRecord.value) getOrCreateRecord(editingDay.value);
};

// テキスト・フラグ更新
const updateRecord = (
  fn: (r: Step7Record) => void,
) => {
  if (editingDay.value == null) return;
  ensureCurrentExists();
  mutate((s) => {
    const r = s.step7.records.find((x) => x.dayNumber === editingDay.value);
    if (r) {
      fn(r);
      r.lastUpdatedAt = new Date().toISOString();
    }
  });
};

const setQ1 = (v: string) =>
  updateRecord((r) => {
    r.q1TodayAchieved = v.slice(0, CONTENT.step7.q1MaxLength);
  });
const setQ1None = (v: boolean) =>
  updateRecord((r) => {
    r.q1NoneFlag = v;
  });
const setQ2 = (v: string) =>
  updateRecord((r) => {
    r.q2FuturePossible = v.slice(0, CONTENT.step7.q2MaxLength);
  });
const setQ3 = (v: string) =>
  updateRecord((r) => {
    r.q3TomorrowGoal = v.slice(0, CONTENT.step7.q3MaxLength);
  });

const submitting = ref(false);
const submitRecord = async () => {
  if (editingDay.value == null) return;
  ensureCurrentExists();
  mutate((s) => {
    const r = s.step7.records.find((x) => x.dayNumber === editingDay.value);
    if (r && !r.firstSubmittedAt) {
      r.firstSubmittedAt = new Date().toISOString();
    }
  });
  submitting.value = true;
  await flush(); // debounce を待たず即時保存
  submitting.value = false;
  alert(`Day ${editingDay.value} の記録を送信しました。`);
};

// 表で行をクリックしたとき
//   新仕様：全 Day 編集可能（未来 Day もロックしない）
const enterDay = (dayNumber: number) => {
  if (dayNumber < 1 || dayNumber > 7) return;
  editingDay.value = dayNumber;
  ensureCurrentExists();
};

// 短い表示（テーブル列で省略表示）
const truncate = (s: string, n: number) => {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
};

const cellPreview = (r: Step7Record | null, key: keyof Step7Record): string => {
  if (!r) return "";
  const v = r[key];
  if (typeof v === "string") return truncate(v, 24) || "（未記入）";
  return "";
};

// Q1 の表示用：none フラグ ON の場合は「（特になし）」
const q1Cell = (r: Step7Record | null): string => {
  if (!r) return "";
  if (r.q1NoneFlag) return "（特になし）";
  return cellPreview(r, "q1TodayAchieved");
};

const fmtMd = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

// Day 状態：今日の Day を current、内容があれば answered、それ以外は empty
const dayState = (dayNumber: number): "answered" | "current" | "empty" => {
  const r = recordOf(dayNumber);
  const isCurrent =
    todayDayNumber.value >= 1 && dayNumber === todayDayNumber.value;
  const hasContent =
    !!r &&
    (r.firstSubmittedAt ||
      r.q1TodayAchieved ||
      r.q2FuturePossible ||
      r.q3TomorrowGoal ||
      r.q1NoneFlag);
  if (hasContent) return isCurrent ? "current" : "answered";
  return isCurrent ? "current" : "empty";
};
</script>

<template>
  <div class="page">
    <header class="row" style="margin-bottom: 12px; flex-wrap: wrap">
      <h1 style="margin: 0; font-size: 18px">{{ CONTENT.app.name }}</h1>
      <span class="small muted" style="margin-left: auto">
        {{ CONTENT.step7.title }}
        <span v-if="saving" style="margin-left: 8px">（保存中…）</span>
      </span>
    </header>

    <!-- ============ クッキーなし ============ -->
    <template v-if="tokenMissing">
      <AppCard>
        <h2>{{ CONTENT.step7.tokenMissingTitle }}</h2>
        <p class="muted">{{ CONTENT.step7.tokenMissingBody }}</p>
      </AppCard>
    </template>

    <!-- ============ トークン無効 ============ -->
    <template v-else-if="notFound">
      <AppCard>
        <h2>このリンクは無効です</h2>
        <p class="muted">
          URL が間違っているか、回答が無効化されている可能性があります。
        </p>
      </AppCard>
    </template>

    <!-- ============ Step 6 未完了 ============ -->
    <template v-else-if="!step6Date">
      <AppCard>
        <h2>{{ CONTENT.step7.notStartedTitle }}</h2>
        <p class="muted">{{ CONTENT.step7.notStartedBody }}</p>
      </AppCard>
    </template>

    <!--
      ============ Day 1〜7 メイン画面 ============
      新仕様：1 週間経過後・/review 提出後も、過去日の追記・編集を可能にする。
      旧 v-else-if="isWorkComplete" / v-else-if="submitted" のゲートは
      バナー（status-banner）に置き換え、フォームは常に表示する。
    -->
    <template v-else>
      <!-- ステータスバナー：1週間経過後・提出済みの場合に表示（フォームは出し続ける） -->
      <div v-if="isWorkComplete || submitted" class="status-banner">
        <p v-if="submitted">
          ✓ 振り返りワークまで提出済みです。1週間ワークの記録は引き続き追記・編集できます。
        </p>
        <p v-else>
          1週間が経過しました。過去日の記録は引き続き追記・編集できます。
        </p>
        <NuxtLink to="/review" class="btn small">
          振り返りワークを{{ submitted ? "見る" : "開く" }}
        </NuxtLink>
      </div>

      <!-- Day 進捗バー -->
      <div class="day-progress">
        <div
          v-for="day in allDays"
          :key="`dp-${day.dayNumber}`"
          class="day-progress__seg"
          :class="`day-progress__seg--${dayState(day.dayNumber)}`"
        >
          <div class="day-progress__num">{{ day.dayNumber }}</div>
          <div class="day-progress__date">{{ fmtMd(day.date) }}</div>
        </div>
      </div>

      <AppCard>
        <header class="row" style="margin-bottom: 8px">
          <strong>Day {{ editingDay }} / 7</strong>
          <span
            v-if="currentRecord?.firstSubmittedAt"
            class="chip chip--accepted small"
            style="margin-left: 8px"
          >
            {{ CONTENT.step7.submittedTag }}
          </span>
          <span class="small muted" style="margin-left: auto">
            {{ allDays.find(d => d.dayNumber === editingDay)?.date ?? "" }}
          </span>
        </header>

        <p v-for="(line, i) in CONTENT.step7.introLines" :key="i" class="small muted">
          {{ line }}
        </p>

        <div class="card card--soft" style="margin-top: 12px">
          <p class="small muted" style="margin: 0">{{ CONTENT.step7.coreLabel }}</p>
          <p style="margin: 4px 0 0">
            <strong>{{ state.coreStatement || "（未入力）" }}</strong>
          </p>
        </div>

        <!-- Q1 -->
        <div class="field" style="margin-top: 20px">
          <label>Q1．{{ CONTENT.step7.q1Label }}</label>
          <textarea
            :value="currentRecord?.q1TodayAchieved ?? ''"
            :maxlength="CONTENT.step7.q1MaxLength"
            :disabled="currentRecord?.q1NoneFlag ?? false"
            @input="setQ1(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ (currentRecord?.q1TodayAchieved ?? '').length }} / {{ CONTENT.step7.q1MaxLength }} 字
          </p>
          <label class="row" style="gap: 6px; font-weight: 400">
            <input
              type="checkbox"
              :checked="currentRecord?.q1NoneFlag ?? false"
              @change="setQ1None(($event.target as HTMLInputElement).checked)"
            />
            <span>{{ CONTENT.step7.q1NoneLabel }}</span>
          </label>
        </div>

        <!-- Q2 -->
        <div class="field">
          <label>Q2．{{ CONTENT.step7.q2Label }}</label>
          <textarea
            :value="currentRecord?.q2FuturePossible ?? ''"
            :maxlength="CONTENT.step7.q2MaxLength"
            @input="setQ2(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ (currentRecord?.q2FuturePossible ?? '').length }} / {{ CONTENT.step7.q2MaxLength }} 字
          </p>
        </div>

        <!-- Q3 -->
        <div class="field">
          <label>Q3．{{ CONTENT.step7.q3Label }}</label>
          <p class="small muted">{{ CONTENT.step7.q3Helper }}</p>
          <textarea
            :value="currentRecord?.q3TomorrowGoal ?? ''"
            :maxlength="CONTENT.step7.q3MaxLength"
            @input="setQ3(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ (currentRecord?.q3TomorrowGoal ?? '').length }} / {{ CONTENT.step7.q3MaxLength }} 字
          </p>
        </div>

        <div class="btn-row">
          <span />
          <div class="btn-right">
            <button
              type="button"
              class="btn btn--primary"
              :disabled="submitting"
              @click="submitRecord"
            >
              {{ submitting ? "送信中..." : CONTENT.step7.submitButton }}
            </button>
          </div>
        </div>
      </AppCard>

      <!-- 過去記録テーブル -->
      <AppCard>
        <h3>{{ CONTENT.step7.tableTitle }}</h3>
        <div class="table-wrap">
          <table class="table records-table">
            <thead>
              <tr>
                <th v-for="(h, i) in CONTENT.step7.tableHeaders" :key="i">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="d in allDays"
                :key="`row-${d.dayNumber}`"
                :class="{
                  'records-table__row--current': d.dayNumber === todayDayNumber,
                  'records-table__row--editing': d.dayNumber === editingDay,
                }"
              >
                <td><strong>Day {{ d.dayNumber }}</strong></td>
                <td class="small">{{ fmtMd(d.date) }}</td>
                <td class="small">{{ q1Cell(recordOf(d.dayNumber)) }}</td>
                <td class="small">
                  {{ cellPreview(recordOf(d.dayNumber), "q2FuturePossible") }}
                </td>
                <td class="small">
                  {{ cellPreview(recordOf(d.dayNumber), "q3TomorrowGoal") }}
                </td>
                <td>
                  <button
                    type="button"
                    class="btn small"
                    @click="enterDay(d.dayNumber)"
                  >
                    {{ recordOf(d.dayNumber)?.firstSubmittedAt
                      ? CONTENT.step7.editButton
                      : CONTENT.step7.enterButton }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 振り返りワークへの導線（記録が未記入でもいつでも進める） -->
        <div class="btn-row" style="margin-top: 16px">
          <span />
          <div class="btn-right">
            <NuxtLink to="/review" class="btn btn--primary">
              {{ CONTENT.step7.reviewButtonLabel }}
            </NuxtLink>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<style scoped>
.day-progress {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}
.day-progress__seg {
  text-align: center;
  padding: 8px 4px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
}
.day-progress__seg--empty {
  background: #fff;
  color: var(--text-soft);
}
.day-progress__seg--answered {
  background: #ecfdf5;
  border-color: #10b981;
  color: #065f46;
}
.day-progress__seg--current {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-fg);
  font-weight: 700;
}
.day-progress__num { font-weight: 700; font-size: 13px; }
.day-progress__date { font-size: 10px; opacity: 0.9; }

.table-wrap {
  overflow-x: auto;
}
.records-table {
  min-width: 540px;
}
.records-table__row--current { background: #ecfdf5; }
.records-table__row--editing { box-shadow: inset 3px 0 0 var(--accent); }

.status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: var(--radius);
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 13px;
}
.status-banner p { margin: 0; flex: 1; min-width: 220px; }
.status-banner .btn { white-space: nowrap; }
</style>
