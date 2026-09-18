import { initializeStoryPresence, prepareStory, publishStory, removeStory, reactToStory, cleanupExpiredStories } from './services/storyService';
import * as admin from 'firebase-admin';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { runSeedDatabase } from './services/seedService';
import { registerUser, ensureUserProfile } from './services/authService';
import { createGroup, getGroupMembers, joinGroupWithInviteCode } from './services/groupService';
import {
  discardStudySession,
  finishStudySession,
  getCurrentSession,
  pauseStudySession,
  resumeStudySession,
  startStudySession,
} from './services/timerService';
import { getLeaderboard, RankingPeriod } from './services/rankingService';
import { getUserHistory, getUserStats } from './services/statsService';
import {
  addComment,
  deleteComment,
  getGroupFeed,
  getPostComments,
  getPostLikes,
  toggleLikePost,
} from './services/socialService';
import { recalculateUserStats } from './services/auditService';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { createSeason, transitionSeason, closeExpiredSeasons } from './services/seasonService';
import { createSubject, getSubjectChartData, getSubjectSessions, getSubjectSetup, requestSubject, reviewSubject, saveSessionDetails, setPreferredSubjects, setSubjectColor } from './services/subjectService';


// Inicializa o Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configuração padrão de região (São Paulo ou padrão us-central1 conforme configuração de projeto)
setGlobalOptions({
  region: 'southamerica-east1', // São Paulo
  maxInstances: 10,
  invoker: 'public',
});

export const create_season = onCall(async request => createSeason(assertAuthenticated(request.auth), request.data));
export const start_season = onCall(async request => transitionSeason(assertAuthenticated(request.auth), request.data?.seasonId, 'start'));
export const close_season = onCall(async request => transitionSeason(assertAuthenticated(request.auth), request.data?.seasonId, 'close'));
export const close_expired_seasons = onSchedule({ schedule: 'every 1 hours', retryCount: 3 }, closeExpiredSeasons);

/**
 * Helper para validar se a requisição possui usuário autenticado
 */
function assertAuthenticated(auth: any): string {
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'Ação permitida apenas para usuários autenticados.');
  }
  return auth.uid;
}

// ============================================================================
// 1. AUTENTICAÇÃO E CADASTRO
// ============================================================================

export const register_user = onCall({ invoker: 'public' }, async (request) => {
  const { name, nickname, password } = request.data || {};
  return await registerUser({ name, nickname, password });
});

export const ensure_user_profile = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  return await ensureUserProfile(uid);
});

// ============================================================================
// 2. GESTÃO DE GRUPOS PRIVADOS
// ============================================================================

export const create_group = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  const { name, inviteCode, timezone } = request.data || {};
  return await createGroup(uid, { name, inviteCode, timezone });
});

export const join_group_with_code = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  const { inviteCode } = request.data || {};
  return await joinGroupWithInviteCode(uid, inviteCode);
});

export const get_group_members = onCall({ invoker: 'public' }, async (request) => {
  assertAuthenticated(request.auth);
  const { groupId } = request.data || {};
  if (!groupId) {
    throw new HttpsError('invalid-argument', 'O ID do grupo é obrigatório.');
  }
  return await getGroupMembers(groupId);
});

// ============================================================================
// 3. CRONÔMETRO DE ESTUDO (OPERAÇÕES CRÍTICAS)
// ============================================================================

export const start_study_session = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  return await startStudySession(uid);
});

export const pause_study_session = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  return await pauseStudySession(uid);
});

export const resume_study_session = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  return await resumeStudySession(uid);
});

export const finish_study_session = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  return await finishStudySession(uid);
});

export const discard_study_session = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  await discardStudySession(uid);
  return { success: true };
});

export const get_current_session = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  return await getCurrentSession(uid);
});

export const get_subject_setup = onCall(async request => getSubjectSetup(assertAuthenticated(request.auth)));
export const create_subject = onCall(async request => createSubject(assertAuthenticated(request.auth), request.data?.name));
export const request_subject = onCall(async request => requestSubject(assertAuthenticated(request.auth), request.data?.name));
export const review_subject = onCall(async request => reviewSubject(assertAuthenticated(request.auth), request.data?.requestId, request.data?.decision, request.data?.name));
export const set_preferred_subjects = onCall(async request => setPreferredSubjects(assertAuthenticated(request.auth), request.data?.subjectIds));
export const set_subject_color = onCall(async request => setSubjectColor(assertAuthenticated(request.auth), request.data?.subjectId, request.data?.color));
export const save_session_details = onCall(async request => saveSessionDetails(assertAuthenticated(request.auth), request.data));
export const get_subject_sessions = onCall(async request => getSubjectSessions(assertAuthenticated(request.auth)));
export const get_subject_chart_data = onCall(async request => getSubjectChartData(assertAuthenticated(request.auth), request.data?.uid || assertAuthenticated(request.auth)));

// ============================================================================
// 4. RANKING E CLASSIFICAÇÃO
// ============================================================================

export const get_leaderboard = onCall({ invoker: 'public' }, async (request) => {
  assertAuthenticated(request.auth);
  const { groupId, period } = request.data || {};
  return await getLeaderboard(groupId, period as RankingPeriod);
});

// ============================================================================
// 5. ESTATÍSTICAS E HISTÓRICO
// ============================================================================

export const get_user_stats = onCall({ invoker: 'public' }, async (request) => {
  const callerUid = assertAuthenticated(request.auth);
  const targetUid = request.data?.uid || callerUid;
  return await getUserStats(targetUid);
});

export const get_user_history = onCall({ invoker: 'public' }, async (request) => {
  const callerUid = assertAuthenticated(request.auth);
  const targetUid = request.data?.uid || callerUid;
  const limit = request.data?.limit || 30;
  return await getUserHistory(targetUid, request.data?.all === true ? null : limit);
});

// ============================================================================
// 6. FEED SOCIAL, CURTIDAS E COMENTÁRIOS
// ============================================================================

export const get_group_feed = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  const { groupId, limit } = request.data || {};
  if (!groupId) throw new HttpsError('invalid-argument', 'O ID do grupo é obrigatório.');
  return await getGroupFeed(groupId, limit || 20, uid);
});

export const toggle_like_post = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  const { postId } = request.data || {};
  if (!postId) throw new HttpsError('invalid-argument', 'O ID da postagem é obrigatório.');
  return await toggleLikePost(uid, postId);
});

export const add_comment = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  const { postId, content } = request.data || {};
  if (!postId || !content) {
    throw new HttpsError('invalid-argument', 'O ID da postagem e o conteúdo do comentário são obrigatórios.');
  }
  return await addComment(uid, postId, content);
});

export const delete_comment = onCall({ invoker: 'public' }, async (request) => {
  const uid = assertAuthenticated(request.auth);
  const { postId, commentId } = request.data || {};
  if (!postId || !commentId) {
    throw new HttpsError('invalid-argument', 'O ID da postagem e o ID do comentário são obrigatórios.');
  }
  await deleteComment(uid, postId, commentId);
  return { success: true };
});

export const get_post_comments = onCall({ invoker: 'public' }, async (request) => {
  assertAuthenticated(request.auth);
  const { postId } = request.data || {};
  if (!postId) throw new HttpsError('invalid-argument', 'O ID da postagem é obrigatório.');
  return await getPostComments(postId);
});

export const get_post_likes = onCall({ invoker: 'public' }, async (request) => {
  assertAuthenticated(request.auth);
  const { postId } = request.data || {};
  if (!postId) throw new HttpsError('invalid-argument', 'O ID da postagem é obrigatório.');
  return await getPostLikes(postId);
});

// ============================================================================
// 7. AUDITORIA E RECONCILIAÇÃO DE AGREGADOS
// ============================================================================

export const recalculate_user_stats = onCall({ invoker: 'public' }, async (request) => {
  const callerUid = assertAuthenticated(request.auth);
  const targetUid = request.data?.uid || callerUid;
  return await recalculateUserStats(targetUid);
});

// ============================================================================
// 8. SETUP ADMINISTRATIVO & SEED (HOMOLOGAÇÃO)
// ============================================================================

export const seed_homolog_database = onRequest({ invoker: 'public' }, async (req, res) => {
  const currentProject = process.env.GCLOUD_PROJECT || '';
  if (currentProject !== 'grupo-de-estudos-homologacao') {
    res.status(403).json({
      error: 'Operação permitida somente no projeto de homologação.',
    });
    return;
  }

  try {
    const result = await runSeedDatabase(admin.firestore());
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro ao executar seed_homolog_database:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Erro interno ao executar seed.',
    });
  }
});

export const prepare_study_story = onCall(request => prepareStory(assertAuthenticated(request.auth)));
export const publish_study_story = onCall(request => publishStory(assertAuthenticated(request.auth), request.data?.storyId));
export const remove_study_story = onCall(request => removeStory(assertAuthenticated(request.auth), request.data?.storyId));
export const react_to_study_story = onCall(request => reactToStory(assertAuthenticated(request.auth), request.data));
export const expire_study_stories = onSchedule({ schedule: 'every 1 hours', retryCount: 3 }, cleanupExpiredStories);

export const initialize_story_presence = onCall(request => initializeStoryPresence(assertAuthenticated(request.auth)));
