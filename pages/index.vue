<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const { isAdmin } = useIsAdmin();
const user = useSupabaseUser();
const supabase = useSupabaseClient();

const signOut = async () => {
  await supabase.auth.signOut();
  await navigateTo("/login");
};
</script>

<template>
  <div class="page page--narrow">
    <header class="row" style="margin-bottom: 24px">
      <h1 style="margin: 0">{{ CONTENT.app.name }}</h1>
      <span class="small muted" style="margin-left: auto">{{ user?.email }}</span>
    </header>

    <AppCard>
      <h2>{{ CONTENT.app.headerSubtitle }}</h2>
      <p class="muted">{{ CONTENT.app.tagline1 }}{{ CONTENT.app.tagline2 }}</p>

      <div class="btn-row">
        <span />
        <div class="btn-right">
          <NuxtLink to="/assessment" class="btn btn--primary">
            アセスメントを開始
          </NuxtLink>
        </div>
      </div>
    </AppCard>

    <AppCard v-if="isAdmin" soft>
      <h3>{{ CONTENT.admin.dashboardTitle }}</h3>
      <div class="row">
        <NuxtLink to="/admin" class="btn">管理ダッシュボード</NuxtLink>
        <NuxtLink to="/admin/invitations" class="btn">{{ CONTENT.admin.invitationsLink }}</NuxtLink>
        <NuxtLink to="/admin/export" class="btn">{{ CONTENT.admin.exportLink }}</NuxtLink>
      </div>
    </AppCard>

    <div class="row row--end" style="margin-top: 24px">
      <button type="button" class="btn btn--ghost small" @click="signOut">
        ログアウト
      </button>
    </div>
  </div>
</template>
