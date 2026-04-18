<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const importing = ref(false);
const message = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const onImport = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importing.value = true;
  message.value = "";
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await $fetch<{ ok: boolean; imported: number }>(
      "/api/import/xlsx",
      {
        method: "POST",
        body: fd,
      },
    );
    message.value = `インポート完了: ${res.imported} 行`;
  } catch (err) {
    console.error(err);
    message.value = "インポートに失敗しました";
  } finally {
    importing.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};
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

    <AppCard soft>
      <h3>{{ CONTENT.admin.importLabel }}</h3>
      <p class="small muted">
        以前のスタンドアロン版（reroots v2 .jsx）でエクスポートした Excel ファイルを
        取り込めます。ファイルの 1 行目にある「回答者メール」をキーに既存ユーザの
        responses を更新します。
      </p>
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx"
        :disabled="importing"
        @change="onImport"
      />
      <p v-if="message" class="small" style="margin-top: 12px">{{ message }}</p>
    </AppCard>
  </div>
</template>
