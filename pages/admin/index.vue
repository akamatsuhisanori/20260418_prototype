<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

definePageMeta({ middleware: [] }); // global middleware で admin 判定済み

type Summary = {
  totalRespondents: number;
  inProgressRespondents: number;
  submittedResponses: number;
  revokedRespondents: number;
};

const { data } = await useFetch<Summary>("/api/admin/summary");
</script>

<template>
  <div class="page">
    <header class="row" style="margin-bottom: 24px">
      <h1 style="margin: 0">{{ CONTENT.admin.dashboardTitle }}</h1>
      <NuxtLink to="/" class="btn btn--ghost small" style="margin-left: auto">
        ← ホーム
      </NuxtLink>
    </header>

    <AppCard>
      <h3>集計</h3>
      <div class="row" style="gap: 24px">
        <div>
          <div class="tiny muted">発行済 URL</div>
          <div><strong>{{ data?.totalRespondents ?? "-" }}</strong></div>
        </div>
        <div>
          <div class="tiny muted">回答中</div>
          <div><strong>{{ data?.inProgressRespondents ?? "-" }}</strong></div>
        </div>
        <div>
          <div class="tiny muted">提出済</div>
          <div><strong>{{ data?.submittedResponses ?? "-" }}</strong></div>
        </div>
        <div>
          <div class="tiny muted">失効</div>
          <div><strong>{{ data?.revokedRespondents ?? "-" }}</strong></div>
        </div>
      </div>
    </AppCard>

    <AppCard soft>
      <div class="row">
        <NuxtLink to="/admin/respondents" class="btn">
          {{ CONTENT.admin.respondentsLink }}
        </NuxtLink>
        <NuxtLink to="/admin/export" class="btn">
          {{ CONTENT.admin.exportLink }}
        </NuxtLink>
      </div>
    </AppCard>
  </div>
</template>
