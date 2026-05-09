<script setup lang="ts">
// ============================================================
// 完了画面：振り返りアンケート（Google フォーム）への誘導。
//   URL は public runtimeConfig.surveyUrl に設定。
//   印刷用レポート（/assessment/:token/report）へのリンクも併設。
// ============================================================
import { CONTENT } from "~/content/assessment";

const config = useRuntimeConfig();
const surveyUrl = computed(
  () => (config.public as Record<string, unknown>).surveyUrl as string | undefined,
);

const route = useRoute();
const token = computed(() =>
  Array.isArray(route.params.token)
    ? route.params.token[0]
    : (route.params.token as string),
);
const reportPath = computed(
  () => `/assessment/${encodeURIComponent(token.value)}/report`,
);
</script>

<template>
  <AppCard>
    <h2 class="center">🎉 {{ CONTENT.done.title }}</h2>
    <p class="center" style="margin-top: 16px">{{ CONTENT.done.body1 }}</p>
    <p class="center muted">{{ CONTENT.done.body2 }}</p>

    <div class="btn-row" style="justify-content: center; margin-top: 32px; gap: 12px">
      <NuxtLink :to="reportPath" class="btn">
        🖨️ 回答結果を印刷用に表示
      </NuxtLink>
      <a
        v-if="surveyUrl"
        :href="surveyUrl"
        target="_blank"
        rel="noopener"
        class="btn btn--primary"
      >
        {{ CONTENT.done.surveyButton }}
      </a>
    </div>
    <p v-if="!surveyUrl" class="small muted center" style="margin-top: 12px">
      {{ CONTENT.done.surveyMissing }}
    </p>
  </AppCard>
</template>
