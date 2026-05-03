<script setup lang="ts">
import { CONTENT } from "~/content/assessment";
</script>

<template>
  <div class="page">
    <header class="row" style="margin-bottom: 24px">
      <h1 style="margin: 0">{{ CONTENT.admin.exportLink }}</h1>
      <NuxtLink to="/admin" class="btn btn--ghost small" style="margin-left: auto">
        ← 管理画面
      </NuxtLink>
    </header>

    <AppCard>
      <h3>ダウンロード</h3>
      <p class="small muted">
        全回答者のデータをまとめて出力します。管理者のみアクセス可能です。
      </p>
      <div class="row" style="margin-top: 12px">
        <a href="/api/export/csv" class="btn btn--primary" download>
          {{ CONTENT.admin.csvDownload }}
        </a>
        <a href="/api/export/xlsx" class="btn" download>
          {{ CONTENT.admin.xlsxDownload }}
        </a>
      </div>
    </AppCard>
  </div>
</template>
