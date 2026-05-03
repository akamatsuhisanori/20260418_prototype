<script setup lang="ts">
// ============================================================
// /admin/respondents
//   回答者用 URL の発行と管理。
//   - 「新規発行」でトークンを作成し URL をコピーして配布
//   - 既存トークンはステータス（未着手/回答中/提出済/失効）と URL を表示
//   - 失効ボタンで is_revoked = true に
// ============================================================
import { CONTENT } from "~/content/assessment";

type Row = {
  id: string;
  access_token: string;
  label: string | null;
  is_submitted: boolean;
  is_revoked: boolean;
  started_at: string;
  updated_at: string;
  submitted_at: string | null;
};

const list = ref<Row[]>([]);
const newLabel = ref("");
const loading = ref(false);
const lastCreated = ref<Row | null>(null);
const loadError = ref<string>("");

const origin = computed(() =>
  typeof window !== "undefined" ? window.location.origin : "",
);

const urlOf = (token: string) =>
  `${origin.value}/assessment/${encodeURIComponent(token)}`;

const statusOf = (row: Row) => {
  if (row.is_revoked) return { label: "失効", cls: "chip--revoked" };
  if (row.is_submitted) return { label: "提出済", cls: "chip--accepted" };
  if (row.updated_at && row.updated_at !== row.started_at)
    return { label: "回答中", cls: "chip--accepted" };
  return { label: "未着手", cls: "chip--pending" };
};

const load = async () => {
  loadError.value = "";
  try {
    list.value = await $fetch<Row[]>("/api/admin/respondents");
  } catch (e: any) {
    const msg =
      e?.data?.statusMessage ||
      e?.data?.message ||
      e?.statusMessage ||
      e?.message ||
      "unknown error";
    const detail = e?.data?.data
      ? ` (${JSON.stringify(e.data.data)})`
      : "";
    loadError.value = `${msg}${detail}`;
    console.error("[load /api/admin/respondents]", e);
  }
};

await load();

const createNew = async () => {
  loading.value = true;
  try {
    const created = await $fetch<Row>("/api/admin/respondents", {
      method: "POST",
      body: { label: newLabel.value.trim() || undefined },
    });
    lastCreated.value = created;
    newLabel.value = "";
    await load();
  } catch (e) {
    console.error(e);
    alert("発行に失敗しました");
  } finally {
    loading.value = false;
  }
};

const copy = async (token: string) => {
  const url = urlOf(token);
  try {
    await navigator.clipboard.writeText(url);
    alert("URL をコピーしました");
  } catch {
    prompt("コピーしてください:", url);
  }
};

const revoke = async (id: string) => {
  if (!confirm("このトークンを失効させますか？回答者はアクセスできなくなります。")) return;
  await $fetch(`/api/admin/respondents/${id}/revoke`, { method: "POST" });
  await load();
};

const remove = async (id: string) => {
  if (!confirm("回答ごと完全に削除します。元には戻せません。よろしいですか？")) return;
  await $fetch(`/api/admin/respondents/${id}`, { method: "DELETE" });
  await load();
};
</script>

<template>
  <div class="page">
    <header class="row" style="margin-bottom: 24px">
      <h1 style="margin: 0">{{ CONTENT.admin.respondentsLink }}</h1>
      <NuxtLink to="/admin" class="btn btn--ghost small" style="margin-left: auto">
        ← 管理画面
      </NuxtLink>
    </header>

    <AppCard v-if="loadError" soft>
      <p class="small" style="color: var(--danger)">
        読み込みエラー: {{ loadError }}
      </p>
    </AppCard>

    <AppCard>
      <h3>新規発行</h3>
      <p class="small muted">
        URL を発行して回答者に共有してください。URL を知っている人だけが回答できます。
      </p>
      <form class="row" @submit.prevent="createNew">
        <input
          v-model="newLabel"
          type="text"
          placeholder="ラベル（任意：例「山田さん」「Aさん」）"
          style="flex: 1"
        />
        <button type="submit" class="btn btn--primary" :disabled="loading">
          URL を発行
        </button>
      </form>

      <AppCard v-if="lastCreated" soft style="margin-top: 12px">
        <p class="small">発行しました。下記 URL を回答者にお渡しください。</p>
        <code style="display: block; word-break: break-all; padding: 8px; background: var(--bg);">
          {{ urlOf(lastCreated.access_token) }}
        </code>
        <div class="row" style="margin-top: 8px">
          <button type="button" class="btn small" @click="copy(lastCreated.access_token)">
            URL をコピー
          </button>
        </div>
      </AppCard>
    </AppCard>

    <AppCard>
      <h3>発行済リスト ({{ list.length }})</h3>
      <table class="table">
        <thead>
          <tr>
            <th>ラベル</th>
            <th>状態</th>
            <th>開始</th>
            <th>更新</th>
            <th>提出</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row.id">
            <td>{{ row.label || "(無題)" }}</td>
            <td>
              <span class="chip" :class="statusOf(row).cls">
                {{ statusOf(row).label }}
              </span>
            </td>
            <td class="small muted">
              {{ new Date(row.started_at).toLocaleDateString() }}
            </td>
            <td class="small muted">
              {{ new Date(row.updated_at).toLocaleDateString() }}
            </td>
            <td class="small muted">
              {{ row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : "-" }}
            </td>
            <td>
              <div class="row">
                <button
                  type="button"
                  class="btn small"
                  :disabled="row.is_revoked"
                  @click="copy(row.access_token)"
                >
                  URL をコピー
                </button>
                <button
                  v-if="!row.is_revoked"
                  type="button"
                  class="btn btn--danger small"
                  @click="revoke(row.id)"
                >
                  失効
                </button>
                <button
                  type="button"
                  class="btn btn--danger small"
                  @click="remove(row.id)"
                >
                  削除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </AppCard>
  </div>
</template>
