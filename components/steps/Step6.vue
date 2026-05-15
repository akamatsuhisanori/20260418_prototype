<script setup lang="ts">
// ============================================================
// Step 6：明日から自分らしさを発揮できそうな場面（旧 web ワーク末尾）
//   subStep 0: シーン入力（最大 10 行）
//   subStep 1: 1 週間ワーク（/daily）への橋渡し
//
//   完了時に step6CompletedAt を「今日」の ISO 文字列でセットする。
//   この日付の翌日が Day 1 となる。
//   ※ ここでは submit() は呼ばない（最終 submit は Step 8 /review）。
// ============================================================
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate } = useAssessmentState();

const subStep = computed({
  get: () => state.value.meta.subStep,
  set: (v: number) =>
    mutate((s) => {
      s.meta.subStep = v;
    }),
});

onMounted(() => {
  if (state.value.step6.scenes.length === 0) {
    mutate((s) => {
      s.step6.scenes.push("");
    });
  }
});

const setScene = (i: number, v: string) =>
  mutate((s) => {
    s.step6.scenes[i] = v.slice(0, CONTENT.step6.sceneMaxLength);
  });

const addScene = () =>
  mutate((s) => {
    if (s.step6.scenes.length < CONTENT.step6.maxScenes) s.step6.scenes.push("");
  });

const removeScene = (i: number) =>
  mutate((s) => {
    s.step6.scenes.splice(i, 1);
    if (s.step6.scenes.length === 0) s.step6.scenes.push("");
  });

// 今日の日付（YYYY-MM-DD）を取得
const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const onComplete = () => {
  mutate((s) => {
    // 既に完了済みなら上書きしない（Day 番号を保護）
    if (!s.step6CompletedAt) {
      s.step6CompletedAt = todayIso();
    }
    s.meta.subStep = 1;
  });
};

const dailyOrigin = computed(() => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
});
const dailyFullUrl = computed(() => `${dailyOrigin.value}/daily`);

const copyDailyUrl = async () => {
  try {
    await navigator.clipboard.writeText(dailyFullUrl.value);
    alert("URL をコピーしました。");
  } catch {
    // Clipboard API が使えない環境（古いブラウザ等）はプロンプトでフォールバック
    if (typeof window !== "undefined") prompt("コピーしてください:", dailyFullUrl.value);
  }
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.step6.title }}</h2>

    <!-- ============ subStep 0: シーン入力 ============ -->
    <template v-if="subStep === 0">
      <p v-for="(line, i) in CONTENT.step6.intro" :key="i" class="muted">
        {{ line }}
      </p>

      <div class="card card--soft" style="margin-top: 12px">
        <p class="small" style="margin: 0"><strong>{{ CONTENT.step6.exampleHeader }}</strong></p>
        <p class="small muted" style="margin: 4px 0 0">
          {{ CONTENT.step6.exampleBody }}
        </p>
      </div>

      <h3 style="margin-top: 24px">{{ CONTENT.step6.inputLabel }}</h3>
      <div class="stack">
        <div
          v-for="(scene, i) in state.step6.scenes"
          :key="i"
          class="row"
          style="gap: 8px"
        >
          <input
            type="text"
            :value="scene"
            :placeholder="CONTENT.step6.scenePlaceholder"
            :maxlength="CONTENT.step6.sceneMaxLength"
            style="flex: 1"
            @input="setScene(i, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="btn btn--ghost small"
            @click="removeScene(i)"
          >
            {{ CONTENT.step6.removeSceneButton }}
          </button>
        </div>
      </div>

      <button
        type="button"
        class="btn"
        :disabled="state.step6.scenes.length >= CONTENT.step6.maxScenes"
        style="margin-top: 12px"
        @click="addScene"
      >
        {{ CONTENT.step6.addSceneButton }}
      </button>

      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.step6.completeButton"
        @back="emit('back')"
        @next="onComplete"
      />
    </template>

    <!-- ============ subStep 1: 1 週間ワーク案内 ============ -->
    <template v-else>
      <h3 style="margin-top: 8px">{{ CONTENT.step6.bridgeTitle }}</h3>
      <p v-for="(line, i) in CONTENT.step6.bridgeLines" :key="i">{{ line }}</p>

      <div class="card card--soft" style="margin-top: 16px">
        <p class="small muted" style="margin: 0">{{ CONTENT.step6.bridgePathLabel }}</p>
        <code
          style="display: block; word-break: break-all; padding: 8px; background: var(--bg); margin-top: 8px"
        >
          {{ dailyFullUrl }}
        </code>
        <div class="row" style="margin-top: 8px">
          <button type="button" class="btn small" @click="copyDailyUrl">
            URL をコピー
          </button>
        </div>
      </div>

      <p class="small muted" style="margin-top: 12px">
        {{ CONTENT.step6.bridgeBookmarkNote }}
      </p>

      <div class="btn-row">
        <button type="button" class="btn btn--ghost" @click="subStep = 0">
          ← シーン入力に戻る
        </button>
        <div class="btn-right">
          <NuxtLink to="/daily" class="btn btn--primary">
            {{ CONTENT.step6.bridgeOpenLabel }}
          </NuxtLink>
        </div>
      </div>
    </template>
  </AppCard>
</template>
