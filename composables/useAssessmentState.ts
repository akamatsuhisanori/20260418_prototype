// ============================================================
// useAssessmentState
//   Step 1〜8 までの state を Vue 側で持ち、
//   /api/respondent/[token] 経由で Supabase へ debounce 保存する。
//
//   トークンは（1）assessment ページ URL から取得して setToken() で
//   セットされる経路と、（2）/daily や /review 等の固定 URL から
//   useCookie("reroots-token") を通じて読み出す経路の 2 つを持つ。
// ============================================================
import type {
  AssessmentState,
  Triad,
  Axis,
  GapItem,
  Step7Record,
  Step8Review,
} from "~/types/database.types";

export const TOKEN_COOKIE_NAME = "reroots-token";

const EMPTY_AXIS = (): Axis => ({ detail: "", summary: "" });
const EMPTY_TRIAD = (): Triad => ({
  who: EMPTY_AXIS(),
  why: EMPTY_AXIS(),
  what: EMPTY_AXIS(),
});
const EMPTY_GAP = (): GapItem => ({ hasGap: null, action: "" });

const EMPTY_STEP8 = (): Step8Review => ({
  q1CommonPatterns: "",
  q2NewAwareness: "",
  q3CurrentEnvPossibilities: "",
  q4EnvironmentDesign: "",
  q5NewOpportunities: "",
  q5NoneFlag: false,
  q6OneLine: "",
  submittedAt: null,
});

export const EMPTY_STATE = (): AssessmentState => ({
  organizations: [],
  scores: {},
  selectedOrgId: null,
  selectedOrgManual: false,
  block3: {
    photoDescription: "",
    photoReason: "",
    photoHesitation: 0,
    photoSelectionSeconds: 0,
  },
  block4: EMPTY_TRIAD(),
  coreStatement: "",
  block6: {
    current: EMPTY_TRIAD(),
    future: EMPTY_TRIAD(),
    gaps: {
      who: EMPTY_GAP(),
      why: EMPTY_GAP(),
      what: EMPTY_GAP(),
    },
  },
  step6: { scenes: [] },
  step6CompletedAt: null,
  step7: { records: [] },
  step8: EMPTY_STEP8(),
  meta: {
    step: 0,
    subStep: 0,
    updatedAt: new Date(0).toISOString(),
  },
});

// 古いデータ（プロパティ欠落）を新しい形に補う
const normalize = (loaded: Partial<AssessmentState> | null | undefined): AssessmentState => {
  const base = EMPTY_STATE();
  if (!loaded || typeof loaded !== "object") return base;
  return {
    organizations: Array.isArray(loaded.organizations) ? loaded.organizations : [],
    scores: loaded.scores && typeof loaded.scores === "object" ? loaded.scores : {},
    selectedOrgId: typeof loaded.selectedOrgId === "number" ? loaded.selectedOrgId : null,
    selectedOrgManual: !!loaded.selectedOrgManual,
    block3: {
      photoDescription:
        typeof loaded.block3?.photoDescription === "string"
          ? loaded.block3.photoDescription
          : "",
      photoReason:
        typeof loaded.block3?.photoReason === "string"
          ? loaded.block3.photoReason
          : "",
      photoHesitation:
        typeof loaded.block3?.photoHesitation === "number"
          ? loaded.block3.photoHesitation
          : 0,
      photoSelectionSeconds:
        typeof loaded.block3?.photoSelectionSeconds === "number"
          ? loaded.block3.photoSelectionSeconds
          : 0,
    },
    block4: { ...base.block4, ...(loaded.block4 ?? {}) },
    coreStatement: typeof loaded.coreStatement === "string" ? loaded.coreStatement : "",
    block6: {
      current: { ...base.block6.current, ...(loaded.block6?.current ?? {}) },
      future: { ...base.block6.future, ...(loaded.block6?.future ?? {}) },
      gaps: {
        who: { ...base.block6.gaps.who, ...(loaded.block6?.gaps?.who ?? {}) },
        why: { ...base.block6.gaps.why, ...(loaded.block6?.gaps?.why ?? {}) },
        what: { ...base.block6.gaps.what, ...(loaded.block6?.gaps?.what ?? {}) },
      },
    },
    step6: {
      scenes: Array.isArray(loaded.step6?.scenes)
        ? (loaded.step6!.scenes.filter((x: unknown) => typeof x === "string") as string[])
        : [],
    },
    step6CompletedAt:
      typeof loaded.step6CompletedAt === "string" ? loaded.step6CompletedAt : null,
    step7: {
      records: Array.isArray(loaded.step7?.records)
        ? (loaded.step7!.records.filter(
            (r: any) => r && typeof r === "object",
          ) as Step7Record[])
        : [],
    },
    step8: { ...base.step8, ...(loaded.step8 ?? {}) },
    meta: { ...base.meta, ...(loaded.meta ?? {}) },
  };
};

export const useAssessmentToken = () =>
  useState<string>("reroots-active-token", () => "");

export const useAssessmentState = () => {
  const tokenState = useAssessmentToken();
  const state = useState<AssessmentState>("reroots-assessment", () =>
    EMPTY_STATE(),
  );
  const loaded = useState<boolean>("reroots-assessment-loaded", () => false);
  const saving = useState<boolean>("reroots-assessment-saving", () => false);
  const submitted = useState<boolean>("reroots-assessment-submitted", () => false);
  const notFound = useState<boolean>("reroots-assessment-notfound", () => false);

  const setToken = (token: string) => {
    if (tokenState.value !== token) {
      state.value = EMPTY_STATE();
      loaded.value = false;
      submitted.value = false;
      notFound.value = false;
    }
    tokenState.value = token;
    // /daily, /review といった固定 URL から後で同じ参加者を識別できるよう
    // クッキーにも保存する（30 日有効、SSR セーフ）。
    const c = useCookie<string>(TOKEN_COOKIE_NAME, {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });
    c.value = token;
  };

  // /daily, /review など URL にトークンを含まないページで使うヘルパ。
  // 戻り値が空文字なら未識別。
  const loadTokenFromCookie = (): string => {
    const c = useCookie<string>(TOKEN_COOKIE_NAME);
    return c.value || "";
  };

  // ---------------------------------------------------------
  // load
  // ---------------------------------------------------------
  const load = async () => {
    if (loaded.value) return;
    if (!tokenState.value) {
      notFound.value = true;
      loaded.value = true;
      return;
    }
    try {
      const res = await $fetch<{
        data: Partial<AssessmentState>;
        is_submitted: boolean;
      }>(`/api/respondent/${encodeURIComponent(tokenState.value)}`);
      state.value = normalize(res.data);
      submitted.value = res.is_submitted;
    } catch (e: any) {
      if (e?.statusCode === 404) {
        notFound.value = true;
      } else {
        console.error("[useAssessmentState.load]", e);
      }
    }
    loaded.value = true;
  };

  // ---------------------------------------------------------
  // save (debounce)
  // ---------------------------------------------------------
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    if (submitted.value) return;
    if (notFound.value) return;
    if (!tokenState.value) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      saving.value = true;
      state.value.meta.updatedAt = new Date().toISOString();
      try {
        await $fetch(`/api/respondent/${encodeURIComponent(tokenState.value)}`, {
          method: "PUT",
          body: { data: state.value },
        });
      } catch (e) {
        console.error("[useAssessmentState.save]", e);
      } finally {
        saving.value = false;
      }
    }, 600);
  };

  // 即時保存（debounce を飛ばす）。送信ボタンや離脱前に使う。
  const flush = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (submitted.value || notFound.value || !tokenState.value) return;
    saving.value = true;
    state.value.meta.updatedAt = new Date().toISOString();
    try {
      await $fetch(`/api/respondent/${encodeURIComponent(tokenState.value)}`, {
        method: "PUT",
        body: { data: state.value },
      });
    } catch (e) {
      console.error("[useAssessmentState.flush]", e);
    } finally {
      saving.value = false;
    }
  };

  const mutate = (fn: (s: AssessmentState) => void) => {
    fn(state.value);
    save();
  };

  // ---------------------------------------------------------
  // submit
  // ---------------------------------------------------------
  const submit = async () => {
    if (notFound.value) return false;
    if (!tokenState.value) return false;
    try {
      await $fetch(
        `/api/respondent/${encodeURIComponent(tokenState.value)}/submit`,
        {
          method: "POST",
          body: { data: state.value },
        },
      );
      submitted.value = true;
      return true;
    } catch (e) {
      console.error("[useAssessmentState.submit]", e);
      return false;
    }
  };

  // ---------------------------------------------------------
  // 派生値
  // ---------------------------------------------------------
  const orgById = (id: number | null) => {
    if (id == null) return null;
    return state.value.organizations.find((o) => o.id === id) ?? null;
  };

  const scoreAverage = (orgId: number) => {
    const arr = state.value.scores[String(orgId)];
    if (!arr || arr.length === 0) return 0;
    const filled = arr.filter((v) => v > 0);
    if (filled.length === 0) return 0;
    return filled.reduce((a, b) => a + b, 0) / filled.length;
  };

  const allScoresComplete = (orgId: number) => {
    const arr = state.value.scores[String(orgId)];
    if (!arr) return false;
    return arr.length === 6 && arr.every((v) => v >= 1 && v <= 5);
  };

  const topOrgByTag = (tag: "past" | "current") => {
    const orgs = state.value.organizations.filter((o) => o.tag === tag);
    if (orgs.length === 0) return null;
    let best = orgs[0];
    let bestScore = scoreAverage(best.id);
    for (const o of orgs.slice(1)) {
      const s = scoreAverage(o.id);
      if (s > bestScore) {
        best = o;
        bestScore = s;
      }
    }
    return best;
  };

  const importantOrg = computed(() => orgById(state.value.selectedOrgId));

  return {
    state,
    loaded,
    saving,
    submitted,
    notFound,
    setToken,
    loadTokenFromCookie,
    load,
    save,
    flush,
    mutate,
    submit,
    // derived
    orgById,
    scoreAverage,
    allScoresComplete,
    topOrgByTag,
    importantOrg,
  };
};
