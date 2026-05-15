<script setup lang="ts">
// ============================================================
// /assessment/[token]/report
//   Step 1〜5 の回答結果を縦 A4 で印刷できる形式で表示する。
//   - ログイン不要（トークンを知っていれば閲覧可）
//   - 「印刷する」ボタンで window.print() を呼ぶ
//   - @media print で UI 要素（ボタン等）を非表示にする
// ============================================================
import { CONTENT, AXIS_KEYS } from "~/content/assessment";
import type { AssessmentState, Organization } from "~/types/database.types";

definePageMeta({ layout: false });

const route = useRoute();
const token = computed(() =>
  Array.isArray(route.params.token)
    ? route.params.token[0]
    : (route.params.token as string),
);

const data = ref<AssessmentState | null>(null);
const meta = ref<{
  is_submitted: boolean;
  label: string | null;
  started_at: string | null;
  updated_at: string | null;
  submitted_at: string | null;
} | null>(null);
const notFound = ref(false);
const loadError = ref<string>("");

const fetchReport = async () => {
  try {
    const res = await $fetch<{
      data: AssessmentState;
      is_submitted: boolean;
      label: string | null;
      started_at: string | null;
      updated_at: string | null;
      submitted_at: string | null;
    }>(`/api/respondent/${encodeURIComponent(token.value)}`);
    data.value = res.data;
    meta.value = {
      is_submitted: res.is_submitted,
      label: res.label,
      started_at: res.started_at,
      updated_at: res.updated_at,
      submitted_at: res.submitted_at,
    };
  } catch (e: any) {
    if (e?.statusCode === 404) {
      notFound.value = true;
    } else {
      loadError.value = e?.statusMessage || e?.message || "unknown error";
    }
  }
};

await fetchReport();

const orgs = computed<Organization[]>(() => data.value?.organizations ?? []);
const importantOrg = computed(() =>
  orgs.value.find((o) => o.id === data.value?.selectedOrgId) ?? null,
);
const orgScoreAvg = (orgId: number): number => {
  const arr = data.value?.scores?.[String(orgId)] ?? [];
  const filled = arr.filter((v) => v > 0);
  if (filled.length === 0) return 0;
  return filled.reduce((a, b) => a + b, 0) / filled.length;
};

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const print = () => {
  if (typeof window !== "undefined") window.print();
};
</script>

<template>
  <div class="report-page">
    <template v-if="notFound">
      <div class="report-notice">
        <h2>このリンクは無効です</h2>
        <p class="muted">URL が間違っているか、回答が無効化されている可能性があります。</p>
      </div>
    </template>

    <template v-else-if="loadError">
      <div class="report-notice">
        <h2>読み込みに失敗しました</h2>
        <p class="muted">{{ loadError }}</p>
      </div>
    </template>

    <template v-else-if="data">
      <!-- 画面右上の操作バー（印刷時は非表示） -->
      <div class="report-actions print-hide">
        <NuxtLink :to="`/assessment/${token}`" class="btn btn--ghost small">
          ← 回答画面に戻る
        </NuxtLink>
        <div style="margin-left: auto; display: flex; gap: 8px">
          <button type="button" class="btn btn--primary" @click="print">
            🖨️ 印刷する（A4 縦）
          </button>
        </div>
      </div>

      <!-- 印刷対象 -->
      <article class="report">
        <header class="report__header">
          <h1>{{ CONTENT.app.name }} 回答結果</h1>
          <table class="report__meta">
            <tbody>
              <tr>
                <th>回答者</th>
                <td>{{ meta?.label || "（無題）" }}</td>
              </tr>
              <tr>
                <th>状態</th>
                <td>{{ meta?.is_submitted ? "提出済" : "未提出" }}</td>
              </tr>
              <tr v-if="meta?.submitted_at">
                <th>提出日時</th>
                <td>{{ fmtDate(meta?.submitted_at) }}</td>
              </tr>
              <tr v-else>
                <th>最終更新</th>
                <td>{{ fmtDate(meta?.updated_at) }}</td>
              </tr>
            </tbody>
          </table>
        </header>

        <!-- ============ Step 1 ============ -->
        <section class="report__section">
          <h2>Step 1：過去の所属組織を洗い出し・特定</h2>

          <h3>所属組織の棚卸し</h3>
          <table class="report__table" v-if="orgs.length">
            <thead>
              <tr>
                <th style="width: 32px">#</th>
                <th>組織名</th>
                <th style="width: 80px">区分</th>
                <th style="width: 80px">重なりの強さ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(o, i) in orgs" :key="o.id">
                <td>{{ i + 1 }}</td>
                <td>{{ o.name || "（未入力）" }}</td>
                <td>{{ o.tag === "current" ? "現在" : "過去" }}</td>
                <td>{{ orgScoreAvg(o.id) ? orgScoreAvg(o.id).toFixed(2) : "—" }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="muted">（未入力）</p>

          <h3>重要組織</h3>
          <p>
            <strong>{{ importantOrg?.name || "（未確定）" }}</strong>
            <span v-if="importantOrg" class="small muted">
              （{{ data.selectedOrgManual ? "手動選択" : "自動選定" }}・スコア
              {{ orgScoreAvg(importantOrg.id).toFixed(2) }}）
            </span>
          </p>
        </section>

        <!-- ============ Step 2 ============ -->
        <section class="report__section">
          <h2>Step 2：重要な組織での自分を表す写真を選定</h2>
          <p>
            <strong>滞在時間：</strong>
            {{ data.block3?.photoSelectionSeconds ?? 0 }} 秒
          </p>
        </section>

        <!-- ============ Step 3 ============ -->
        <section class="report__section">
          <h2>Step 3：写真をもとに重要な経験を詳細に想起</h2>

          <h3>Q1. {{ CONTENT.block3.describeQuestion }}</h3>
          <p class="report__answer">{{ data.block3?.photoDescription || "（未入力）" }}</p>

          <h3>Q2. {{ CONTENT.block3.reasonQuestion }}</h3>
          <p class="report__answer">{{ data.block3?.photoReason || "（未入力）" }}</p>

          <h3>Q3. {{ CONTENT.block3.hesitationQuestion }}</h3>
          <p>
            <strong>
              {{ data.block3?.photoHesitation
                ? `${data.block3.photoHesitation} / 7`
                : "（未回答）" }}
            </strong>
            <span class="small muted">
              （1：まったく迷わなかった ／ 7：とても迷った）
            </span>
          </p>
        </section>

        <!-- ============ Step 4 ============ -->
        <section class="report__section">
          <h2>Step 4：自分らしさを言語化</h2>

          <div v-for="key in AXIS_KEYS" :key="`b4-${key}`" class="report__axis">
            <h3>{{ CONTENT.block4.axes[key].label }}</h3>
            <p class="small muted">{{ CONTENT.block4.axes[key].question }}</p>
            <p class="report__answer">{{ data.block4?.[key]?.detail || "（未入力）" }}</p>
            <p>
              <span class="small muted">一言：</span>
              <strong>「{{ data.block4?.[key]?.summary || "（未入力）" }}」</strong>
            </p>
          </div>

          <h3>あなたは何を大切にしている人間なのか</h3>
          <p class="report__answer report__core">
            {{ data.coreStatement || "（未入力）" }}
          </p>
        </section>

        <!-- ============ Step 5 ============ -->
        <section class="report__section">
          <h2>Step 5：自分らしさと現在の環境を接続</h2>

          <h3>9 マス</h3>
          <table class="report__table report__matrix">
            <thead>
              <tr>
                <th></th>
                <th v-for="key in AXIS_KEYS" :key="`mh-${key}`">
                  {{ CONTENT.block6.axisLabels[key] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>過去</th>
                <td v-for="key in AXIS_KEYS" :key="`mp-${key}`">
                  {{ data.block4?.[key]?.summary || "（未入力）" }}
                </td>
              </tr>
              <tr>
                <th>現在</th>
                <td
                  v-for="key in AXIS_KEYS"
                  :key="`mc-${key}`"
                  style="white-space: pre-wrap"
                >
                  {{ data.block6?.current?.[key]?.detail || "（未入力）" }}
                </td>
              </tr>
              <tr>
                <th>未来<br />(1 年後)</th>
                <td
                  v-for="key in AXIS_KEYS"
                  :key="`mf-${key}`"
                  style="white-space: pre-wrap"
                >
                  {{ data.block6?.future?.[key]?.detail || "（未入力）" }}
                </td>
              </tr>
            </tbody>
          </table>

          <h3>ギャップ判定 と 行動</h3>
          <div
            v-for="key in AXIS_KEYS"
            :key="`g-${key}`"
            class="report__axis"
          >
            <h4>{{ CONTENT.block6.axisLabels[key] }}</h4>
            <p>
              <span class="small muted">ギャップ：</span>
              <strong>
                {{ data.block6?.gaps?.[key]?.hasGap === true
                  ? "あり"
                  : data.block6?.gaps?.[key]?.hasGap === false
                    ? "なし"
                    : "（未判定）" }}
              </strong>
            </p>
            <p
              v-if="data.block6?.gaps?.[key]?.hasGap === true"
              class="report__answer"
            >
              <span class="small muted">行動：</span><br />
              {{ data.block6?.gaps?.[key]?.action || "（未入力）" }}
            </p>
          </div>
        </section>

        <footer class="report__footer">
          <p class="tiny muted">
            {{ CONTENT.app.name }} — このシートは回答結果の確認・印刷用です。
          </p>
        </footer>
      </article>
    </template>
  </div>
</template>

<style>
/* ============================================================
   印刷時の縦 A4 レイアウト
   ============================================================ */
@page {
  size: A4 portrait;
  margin: 15mm;
}

.report-page {
  background: var(--bg);
  min-height: 100vh;
  padding: 24px 16px 64px;
}

.report-actions {
  max-width: 800px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.report-notice {
  max-width: 640px;
  margin: 80px auto;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  text-align: center;
}

.report {
  background: #fff;
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 36px;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: #111;
  line-height: 1.6;
}

.report h1 {
  font-size: 22px;
  margin: 0 0 16px;
}
.report h2 {
  font-size: 17px;
  margin: 0 0 8px;
  padding: 6px 10px;
  background: #f1f5f9;
  border-left: 4px solid var(--accent);
}
.report h3 {
  font-size: 14px;
  margin: 12px 0 4px;
  color: #334155;
}
.report h4 {
  font-size: 13px;
  margin: 8px 0 4px;
  color: #475569;
}

.report__header {
  border-bottom: 2px solid #1f2937;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.report__meta {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.report__meta th {
  width: 80px;
  text-align: left;
  padding: 2px 8px 2px 0;
  color: #64748b;
  font-weight: 600;
}
.report__meta td {
  padding: 2px 0;
}

.report__section {
  margin: 14px 0;
  page-break-inside: auto;
}
.report__section + .report__section {
  margin-top: 18px;
}

.report__answer {
  white-space: pre-wrap;
  background: #f8fafc;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  margin: 4px 0 8px;
  font-size: 13px;
  page-break-inside: avoid;
}
.report__core {
  background: #ecfdf5;
  border-color: #10b981;
  font-weight: 600;
}

.report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin: 4px 0 8px;
}
.report__table th,
.report__table td {
  border: 1px solid #cbd5e1;
  padding: 4px 6px;
  text-align: left;
  vertical-align: top;
}
.report__table th {
  background: #f1f5f9;
  font-weight: 600;
}
.report__matrix th:first-child,
.report__matrix td:first-child {
  width: 64px;
  background: #f8fafc;
  font-weight: 600;
}
.report__matrix td {
  min-height: 40px;
}

.report__axis {
  page-break-inside: avoid;
  margin: 6px 0;
}

.report__footer {
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

/* ============================================================
   @media print：UI 要素を消し、用紙幅いっぱいに
   ============================================================ */
@media print {
  :root {
    --bg: #ffffff;
  }
  body, html, #__nuxt {
    background: #fff !important;
    color: #000 !important;
  }
  .print-hide {
    display: none !important;
  }
  .report-page {
    background: #fff !important;
    padding: 0;
    min-height: auto;
  }
  .report {
    border: none;
    max-width: none;
    padding: 0;
    box-shadow: none;
  }
  .report__answer {
    background: #fff;
    border-color: #d1d5db;
  }
  .report__core {
    background: #f0fdf4;
  }
  .report__table th {
    background: #f3f4f6 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .report h2 {
    background: #f1f5f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* セクションの開始位置を整える */
  .report__section {
    page-break-inside: auto;
  }
  .report__section h2 {
    page-break-after: avoid;
  }
}
</style>
