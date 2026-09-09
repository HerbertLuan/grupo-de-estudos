const path = require("path");
async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "grupo-de-estudos-4b504";
  const region = "southamerica-east1";

  let auth, requireAuth, run;
  try {
    const globalNpmRoot = process.env.APPDATA
      ? path.join(process.env.APPDATA, "npm", "node_modules", "firebase-tools")
      : "firebase-tools";
    auth = require(path.join(globalNpmRoot, "lib", "auth"));
    requireAuth = require(path.join(globalNpmRoot, "lib", "requireAuth"));
    run = require(path.join(globalNpmRoot, "lib", "gcp", "run"));
  } catch (err) {
    console.error("Erro ao carregar firebase-tools:", err.message);
    process.exit(1);
  }

  const account = auth.getGlobalDefaultAccount();
  if (!account) {
    console.error("Nenhuma conta autenticada no Firebase CLI. Execute: firebase login");
    process.exit(1);
  }

  const options = { user: account.user, tokens: account.tokens, project: projectId };
  await requireAuth.requireAuth(options);

  const functions = [
    "register_user", "ensure_user_profile", "create_group", "join_group_with_code",
    "get_group_members", "start_study_session", "pause_study_session", "resume_study_session",
    "finish_study_session", "discard_study_session", "get_current_session", "get_leaderboard",
    "get_user_stats", "get_user_history", "get_group_feed", "toggle_like_post",
    "add_comment", "delete_comment", "get_post_comments", "recalculate_user_stats"
  ];

  console.log("Verificando permissoes IAM para " + functions.length + " funcoes em " + region + "...");
  for (const fn of functions) {
    const serviceName = "projects/" + projectId + "/locations/" + region + "/services/" + fn.replace(/_/g, "-");
    try {
      const currentPolicy = await run.getIamPolicy(serviceName);
      const hasInvoker = currentPolicy.bindings && currentPolicy.bindings.some(
        b => b.role === "roles/run.invoker" && b.members && b.members.includes("allUsers")
      );
      if (hasInvoker) {
        console.log("[OK] " + fn);
      } else {
        console.log("[AJUSTANDO] " + fn + " concedendo roles/run.invoker para allUsers...");
        await run.setInvokerUpdate(projectId, serviceName, ["public"]);
        console.log("[SUCESSO] " + fn + " ajustado.");
      }
    } catch (e) {
      console.error("[ERRO] " + fn + ":", e.message);
    }
  }
  console.log("Verificacao de permissoes concluida!");
}

main().catch(console.error);
