<script setup lang="ts">
// ============================================================
// /review — 振り返りワーク（Step 8）
//   - 参加者識別はクッキー（reroots-token）
//   - Day 7 終了後（= 今日が step6CompletedAt + 8 日以降）にのみアクセス可
//   - 6 つの質問を入力 → 送信で is_submitted = true（最終 submit）
// ============================================================
import { CONTENT } from "~/content/assessment";
import type { Step7Record } from "~/types/database.types";

definePageMeta({ layout: false });

const {
  state,
  mutate,
  load,
  flush,
  saving,
  setToken,
  loadTokenFromCookie,
  submit,
  submitted,
  notFound,
} = useAssessmentState();

const cookieToken = loadTokenFromCookie();
const tokenMissing = ref(!cookieToken);
if (cookieToken) {
  setToken(cookieToken);
  await load();
}

const isoDay = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const todayDate = computed(() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
});

const step6Date = computed(() => {
  const raw = state.value.step6CompletedAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
});

// アクセス可能か：step6CompletedAt + 8 日以降であること
const accessAllowed = computed(() => {
  if (!step6Date.value) return false;
  const diff = Math.floor(
    (todayDate.value.getTime() - step6Date.value.getTime()) / 86400000,
  );
  return diff >= 8;
});

// 入力
const setQ1 = (v: string) =>
  mutate((s) => {
    s.step8.q1CommonPatterns = v.slice(0, CONTENT.step8.q1MaxLength);
  });
const setQ2 = (v: string) =>
  mutate((s) => {
    s.step8.q2NewAwareness = v.slice(0, CONTENT.step8.q2MaxLength);
  });
const setQ3 = (v: string) =>
  mutate((s) => {
    s.step8.q3CurrentEnvPossibilities = v.slice(0, CONTENT.step8.q3MaxLength);
  });
const setQ4 = (v: string) =>
  mutate((s) => {
    s.step8.q4EnvironmentDesign = v.slice(0, CONTENT.step8.q4MaxLength);
  });
const setQ5 = (v: string) =>
  mutate((s) => {
    s.step8.q5NewOpportunities = v.slice(0, CONTENT.step8.q5MaxLength);
  });
const setQ5None = (v: boolean) =>
  mutate((s) => {
    s.step8.q5NoneFlag = v;
  });
const setQ6 = (v: string) =>
  mutate((s) => {
    s.step8.q6OneLine = v.slice(0, CONTENT.step8.q6MaxLength);
  });

const submitting = ref(false);
const config = useRuntimeConfig();
const surveyUrl = computed(
  () => (config.public as Record<string, unknown>).surveyUrl as string | undefined,
);

const onSubmit = async () => {
  submitting.value = true;
  // 提出時刻を記録
  mutate((s) => {
    s.step8.submittedAt = new Date().toISOString();
  });
  // 直前の編集も含めて確実に保存してから submit
  await flush();
  const ok = await submit();
  submitting.value = false;
  if (!ok) alert("送信に失敗しました。もう一度お試しください。");
};

// テーブル表示用
const records = computed<Step7Record[]>(() =>
  [...state.value.step7.records].sort((a, b) => a.dayNumber - b.dayNumber),
);

const fmtMd = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const truncate = (s: string, n: number) =>
  s && s.length > n ? s.slice(0, n) + "…" : s || "";
</script>

<template>
  <div class="page">
    <header class="row" style="margin-bottom: 12px; flex-wrap: wrap">
      <h1 style="margin: 0; font-size: 18px">{{ CONTENT.app.name }}</h1>
      <span class="small muted" style="margin-left: auto">
        {{ CONTENT.step8.title }}
        <span v-if="saving" style="margin-left: 8px">（保存中…）</span>
      </span>
    </header>

    <!-- クッキーなし -->
    <template v-if="tokenMissing">
      <AppCard>
        <h2>{{ CONTENT.step7.tokenMissingTitle }}</h2>
        <p class="muted">{{ CONTENT.step8.tokenMissingBody }}</p>
      </AppCard>
    </template>

    <!-- トークン無効 -->
    <template v-else-if="notFound">
      <AppCard>
        <h2>このリンクは無効です</h2>
        <p class="muted">
          URL が間違っているか、回答が無効化されている可能性があります。
        </p>
      </AppCard>
    </template>

    <!-- 既に送信済み -->
    <template v-else-if="submitted">
      <AppCard>
        <h2 class="center">{{ CONTENT.step8.doneTitle }}</h2>
        <p class="center" style="margin-top: 12px">{{ CONTENT.step8.doneBody }}</p>
        <div class="btn-row" style="justify-content: center; margin-top: 24px">
          <a
            v-if="surveyUrl"
            :href="surveyUrl"
            target="_blank"
            rel="noopener"
            class="btn btn--primary"
          >
            {{ CONTENT.step8.surveyButton }}
          </a>
          <p v-else class="small muted">{{ CONTENT.done.surveyMissing }}</p>
        </div>
      </AppCard>
    </template>

    <!-- 早すぎ -->
    <template v-else-if="!accessAllowed">
      <AppCard>
        <h2>{{ CONTENT.step8.tooEarlyTitle }}</h2>
        <p class="muted">{{ CONTENT.step8.tooEarlyBody }}</p>
      </AppCard>
    </template>

    <!-- メイン -->
    <template v-else>
      <AppCard>
        <h2>{{ CONTENT.step8.title }}</h2>
        <p v-for="(line, i) in CONTENT.step8.introLines" :key="i" class="muted">
          {{ line }}
        </p>
      </AppCard>

      <!-- 1 週間の記録（参照用） -->
      <AppCard>
        <h3>{{ CONTENT.step8.recordTableTitle }}</h3>
        <div style="overflow-x: auto">
          <table class="table" style="min-width: 540px">
            <thead>
              <tr>
                <th>Day</th>
                <th>日付</th>
                <th>Q1（今日できた）</th>
                <th>Q2（できそう）</th>
                <th>Q3（明日の目標）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.dayNumber">
                <td><strong>Day {{ r.dayNumber }}</strong></td>
                <td class="small">{{ fmtMd(r.targetDate) }}</td>
                <td class="small">
                  {{ r.q1NoneFlag ? "（特になし）" : truncate(r.q1TodayAchieved, 30) || "—" }}
                </td>
                <td class="small">{{ truncate(r.q2FuturePossible, 30) || "—" }}</td>
                <td class="small">{{ truncate(r.q3TomorrowGoal, 30) || "—" }}</td>
              </tr>
              <tr v-if="records.length === 0">
                <td colspan="5" class="muted small center">
                  （1 週間の記録がありません）
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- 6 質問 -->
      <AppCard>
        <div class="field">
          <label>Q1．{{ CONTENT.step8.q1Label }}</label>
          <textarea
            :value="state.step8.q1CommonPatterns"
            :maxlength="CONTENT.step8.q1MaxLength"
            style="min-height: 120px"
            @input="setQ1(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ state.step8.q1CommonPatterns.length }} / {{ CONTENT.step8.q1MaxLength }} 字
          </p>
        </div>

        <div class="field">
          <label>Q2．{{ CONTENT.step8.q2Label }}</label>
          <textarea
            :value="state.step8.q2NewAwareness"
            :maxlength="CONTENT.step8.q2MaxLength"
            style="min-height: 120px"
            @input="setQ2(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ state.step8.q2NewAwareness.length }} / {{ CONTENT.step8.q2MaxLength }} 字
          </p>
        </div>

        <div class="field">
          <label>Q3．{{ CONTENT.step8.q3Label }}</label>
          <textarea
            :value="state.step8.q3CurrentEnvPossibilities"
            :maxlength="CONTENT.step8.q3MaxLength"
            style="min-height: 120px"
            @input="setQ3(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ state.step8.q3CurrentEnvPossibilities.length }} / {{ CONTENT.step8.q3MaxLength }} 字
          </p>
        </div>

        <div class="field">
          <label>Q4．{{ CONTENT.step8.q4Label }}</label>
          <p class="small muted">{{ CONTENT.step8.q4Hint }}</p>
          <textarea
            :value="state.step8.q4EnvironmentDesign"
            :maxlength="CONTENT.step8.q4MaxLength"
            style="min-height: 120px"
            @input="setQ4(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ state.step8.q4EnvironmentDesign.length }} / {{ CONTENT.step8.q4MaxLength }} 字
          </p>
        </div>

        <div class="field">
          <label>Q5．{{ CONTENT.step8.q5Label }}</label>
          <p class="small muted">{{ CONTENT.step8.q5Hint }}</p>
          <textarea
            :value="state.step8.q5NewOpportunities"
            :maxlength="CONTENT.step8.q5MaxLength"
            :disabled="state.step8.q5NoneFlag"
            style="min-height: 120px"
            @input="setQ5(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ state.step8.q5NewOpportunities.length }} / {{ CONTENT.step8.q5MaxLength }} 字
          </p>
          <label class="row" style="gap: 6px; font-weight: 400">
            <input
              type="checkbox"
              :checked="state.step8.q5NoneFlag"
              @change="setQ5None(($event.target as HTMLInputElement).checked)"
            />
            <span>{{ CONTENT.step8.q5NoneLabel }}</span>
          </label>
        </div>

        <div class="field">
          <label>Q6．{{ CONTENT.step8.q6Label }}</label>
          <textarea
            :value="state.step8.q6OneLine"
            :maxlength="CONTENT.step8.q6MaxLength"
            style="min-height: 80px"
            @input="setQ6(($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ state.step8.q6OneLine.length }} / {{ CONTENT.step8.q6MaxLength }} 字
          </p>
        </div>

        <div class="btn-row">
          <span />
          <div class="btn-right">
            <button
              type="button"
              class="btn btn--primary"
              :disabled="submitting"
              @click="onSubmit"
            >
              {{ submitting ? "送信中..." : CONTENT.step8.submitButton }}
            </button>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>
