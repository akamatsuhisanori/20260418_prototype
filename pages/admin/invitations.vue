<script setup lang="ts">
import { CONTENT } from "~/content/assessment";
import type { InvitationRow, Database } from "~/types/database.types";

const supabase = useSupabaseClient<Database>();

const list = ref<InvitationRow[]>([]);
const newEmail = ref("");
const note = ref("");
const loading = ref(false);

const load = async () => {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .order("invited_at", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  list.value = data ?? [];
};

await load();

const addInvite = async () => {
  if (!newEmail.value.trim()) return;
  loading.value = true;
  try {
    await $fetch("/api/invite/create", {
      method: "POST",
      body: { email: newEmail.value.trim(), note: note.value.trim() },
    });
    newEmail.value = "";
    note.value = "";
    await load();
  } catch (e) {
    console.error(e);
    alert("追加に失敗しました");
  } finally {
    loading.value = false;
  }
};

const sendLink = async (email: string) => {
  try {
    await $fetch("/api/invite/send", {
      method: "POST",
      body: { email },
    });
    alert(`${email} にリンクを送信しました`);
  } catch (e) {
    console.error(e);
    alert("送信に失敗しました");
  }
};

const revoke = async (id: string) => {
  if (!confirm("この招待を失効させますか？")) return;
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id);
  await load();
};
</script>

<template>
  <div class="page">
    <header class="row" style="margin-bottom: 24px">
      <h1 style="margin: 0">{{ CONTENT.admin.invitationsLink }}</h1>
      <NuxtLink to="/admin" class="btn btn--ghost small" style="margin-left: auto">
        ← 管理画面
      </NuxtLink>
    </header>

    <AppCard>
      <h3>新規招待</h3>
      <form class="row" @submit.prevent="addInvite">
        <input
          v-model="newEmail"
          type="email"
          :placeholder="CONTENT.admin.inviteEmailPlaceholder"
          required
          style="flex: 1"
        />
        <input
          v-model="note"
          type="text"
          placeholder="メモ (任意)"
          style="flex: 1"
        />
        <button type="submit" class="btn btn--primary" :disabled="loading">
          {{ CONTENT.admin.inviteAdd }}
        </button>
      </form>
    </AppCard>

    <AppCard>
      <h3>招待リスト ({{ list.length }})</h3>
      <table class="table">
        <thead>
          <tr>
            <th>メール</th>
            <th>状態</th>
            <th>メモ</th>
            <th>招待日</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in list" :key="inv.id">
            <td>{{ inv.email }}</td>
            <td>
              <span
                class="chip"
                :class="{
                  'chip--pending': inv.status === 'pending',
                  'chip--accepted': inv.status === 'accepted',
                  'chip--revoked': inv.status === 'revoked',
                }"
              >
                {{ inv.status }}
              </span>
            </td>
            <td class="small">{{ inv.note }}</td>
            <td class="small muted">{{ new Date(inv.invited_at).toLocaleDateString() }}</td>
            <td>
              <div class="row">
                <button
                  v-if="inv.status !== 'revoked'"
                  type="button"
                  class="btn small"
                  @click="sendLink(inv.email)"
                >
                  {{ inv.status === "pending" ? CONTENT.admin.inviteSend : CONTENT.admin.inviteResend }}
                </button>
                <button
                  v-if="inv.status !== 'revoked'"
                  type="button"
                  class="btn btn--danger small"
                  @click="revoke(inv.id)"
                >
                  {{ CONTENT.admin.inviteRevoke }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </AppCard>
  </div>
</template>
