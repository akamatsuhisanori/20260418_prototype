<script setup lang="ts">
// ============================================================
// 完了画面：振り返りアンケート（Google フォーム）への誘導。
//   URL は public runtimeConfig.surveyUrl に設定。
// ============================================================
import { CONTENT } from "~/content/assessment";

const config = useRuntimeConfig();
const surveyUrl = computed(
  () => (config.public as Record<string, unknown>).surveyUrl as string | undefined,
);
</script>

<template>
  <AppCard>
    <h2 class="center">🎉 {{ CONTENT.done.title }}</h2>
    <p class="center" style="margin-top: 16px">{{ CONTENT.done.body1 }}</p>
    <p class="center muted">{{ CONTENT.done.body2 }}</p>

    <div class="btn-row" style="justify-content: center; margin-top: 32px">
      <a
        v-if="surveyUrl"
        :href="surveyUrl"
        target="_blank"
        rel="noopener"
        class="btn btn--primary"
      >
        {{ CONTENT.done.surveyButton }}
      </a>
      <p v-else class="small muted">{{ CONTENT.done.surveyMissing }}</p>
    </div>
  </AppCard>
</template>
