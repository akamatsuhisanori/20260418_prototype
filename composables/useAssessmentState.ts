// ============================================================
// useAssessmentState
//   5 ステップ回答フォームの state を Vue 側で持ち、
//   Supabase `responses` テーブルへ debounce 保存する composable。
//
//   - reactive な state は useState でセッション中にキャッシュ
//   - data は JSONB 1 列で保存（質問を増減してもスキーマ移行不要）
//   - 未ログイン時は触らない（middleware でブロックされる想定）
// ============================================================
import { CONTENT } from "~/content/assessment";
import type { AssessmentState, Database } from "~/types/database.types";

const EMPTY_STATE = (): AssessmentState => ({
  orgs: { past: ["", "", ""], current: ["", "", ""] },
  frequencies: { past: {}, current: {} },
  dimensions: { past: {}, current: {} },
  identityStrength: { past: {}, current: {} },
  dialogue: {},
  actions: {
    craftExperiments: "",
    shiftConnections: "",
    makeSense: "",
  },
  meta: {
    step: 0,
    subStep: 0,
    updatedAt: new Date(0).toISOString(),
  },
});

export const useAssessmentState = () => {
  const state = useState<AssessmentState>("reroots-assessment", () =>
    EMPTY_STATE(),
  );
  const loaded = useState<boolean>("reroots-assessment-loaded", () => false);
  const saving = useState<boolean>("reroots-assessment-saving", () => false);
  const submitted = useState<boolean>("reroots-assessment-submitted", () => false);

  const user = useSupabaseUser();
  const supabase = useSupabaseClient<Database>();

  // ---------------------------------------------------------
  // load: 自分の responses 行を取得。無ければ作る
  // ---------------------------------------------------------
  const load = async () => {
    if (!user.value) return;
    if (loaded.value) return;

    const { data, error } = await supabase
      .from("responses")
      .select("data, is_submitted")
      .eq("user_id", user.value.id)
      .maybeSingle();

    if (error) {
      console.error("[useAssessmentState.load]", error);
      return;
    }

    if (data) {
      state.value = { ...EMPTY_STATE(), ...(data.data as Partial<AssessmentState>) } as AssessmentState;
      submitted.value = data.is_submitted;
    } else {
      // 新規作成
      const { error: insertError } = await supabase
        .from("responses")
        .insert({ user_id: user.value.id, data: state.value });
      if (insertError) console.error("[useAssessmentState.create]", insertError);
    }

    loaded.value = true;
  };

  // ---------------------------------------------------------
  // save: debounce 付きで responses.data を更新
  // ---------------------------------------------------------
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    if (!user.value) return;
    if (submitted.value) return; // 提出済みはロック
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      saving.value = true;
      state.value.meta.updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("responses")
        .update({ data: state.value })
        .eq("user_id", user.value!.id);
      if (error) console.error("[useAssessmentState.save]", error);
      saving.value = false;
    }, 600);
  };

  // state を変更するたびに呼ぶヘルパ
  const mutate = (fn: (s: AssessmentState) => void) => {
    fn(state.value);
    save();
  };

  // ---------------------------------------------------------
  // submit: is_submitted = true にロック
  // ---------------------------------------------------------
  const submit = async () => {
    if (!user.value) return;
    const { error } = await supabase
      .from("responses")
      .update({
        data: state.value,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
      })
      .eq("user_id", user.value.id);
    if (error) {
      console.error("[useAssessmentState.submit]", error);
      return false;
    }
    submitted.value = true;
    return true;
  };

  // ---------------------------------------------------------
  // 派生値（元 jsx のロジックを Vue computed に移植）
  // ---------------------------------------------------------
  // 仕様書 2-4: past / current それぞれ「1件以上」入力されていれば次へ進める。
  // 以前は .every で全3スロット必須になっていたが、spec に合わせて .some に変更。
  const isOrgComplete = (phase: "past" | "current") =>
    state.value.orgs[phase].some((o) => o.trim().length > 0);

  const identityScore = (phase: "past" | "current", orgName: string) => {
    const dims = state.value.dimensions[phase]?.[orgName];
    if (!dims) return 0;
    const vals = CONTENT.questions.dimensions.map((d) => dims[d.key] ?? 0);
    if (vals.some((v) => v === 0)) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const gapScore = (orgName: string) => {
    const past = identityScore("past", orgName);
    const current = identityScore("current", orgName);
    return current - past;
  };

  const getTopOrg = (phase: "past" | "current") => {
    const orgs = state.value.orgs[phase].filter(Boolean);
    if (orgs.length === 0) return null;
    let top = orgs[0];
    let max = identityScore(phase, top);
    for (const o of orgs.slice(1)) {
      const s = identityScore(phase, o);
      if (s > max) {
        max = s;
        top = o;
      }
    }
    return top;
  };

  return {
    state,
    loaded,
    saving,
    submitted,
    load,
    save,
    mutate,
    submit,
    // 派生
    isOrgComplete,
    identityScore,
    gapScore,
    getTopOrg,
  };
};
