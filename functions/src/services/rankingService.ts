import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { GroupMember, LeaderboardEntry } from '../types';
import { calculateLevel } from './gamificationService';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export type RankingPeriod = 'week' | 'month' | 'season' | 'all' | 'hours';

export interface LeaderboardResult {
  period: RankingPeriod;
  groupId: string;
  totalMembers: number;
  entries: LeaderboardEntry[];
}

/**
 * Consulta e ordena o ranking do grupo com resolução determinística de desempate:
 * 1. Pontos DESC (ou Horas DESC no ranking de horas)
 * 2. Total de segundos estudados DESC
 * 3. Data de entrada (joinedAt) ASC
 */
export async function getLeaderboard(
  groupId: string,
  period: RankingPeriod = 'week'
): Promise<LeaderboardResult> {
  if (!groupId) {
    throw new HttpsError('invalid-argument', 'O ID do grupo é obrigatório.');
  }

  const membersSnap = await db
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .get();

  if (membersSnap.empty) {
    return {
      period,
      groupId,
      totalMembers: 0,
      entries: [],
    };
  }

  const members = membersSnap.docs.map((d) => d.data() as GroupMember);

  // Busca os perfis de usuário atualizados (users/{uid}) para garantir foto, nome e streak recentes
  const userRefs = members.map((m) => db.collection('users').doc(m.uid));
  const userDocs = userRefs.length > 0 ? await db.getAll(...userRefs) : [];
  const userMap = new Map<string, FirebaseFirestore.DocumentData>();
  userDocs.forEach((d) => {
    if (d.exists) {
      userMap.set(d.id, d.data()!);
    }
  });

  // Background sync: atualiza o subdocumento de membro se avatarUrl ou nome mudou no perfil do usuário
  membersSnap.docs.forEach((docSnap, idx) => {
    const m = members[idx];
    const u = userMap.get(m.uid);
    if (u) {
      const latestAvatar = u.avatarUrl !== undefined ? u.avatarUrl : (m.avatarUrl || null);
      const latestName = u.name || m.name;
      const latestNickname = u.nickname || m.nickname;
      if (m.avatarUrl !== latestAvatar || m.name !== latestName || m.nickname !== latestNickname) {
        docSnap.ref.update({
          avatarUrl: latestAvatar,
          name: latestName,
          nickname: latestNickname,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((err) => console.error(`Erro ao sincronizar membro ${m.uid}:`, err));
      }
    }
  });

  // Mapeamento dos valores conforme o período
  const mapped = members.map((m) => {
    const u = userMap.get(m.uid);
    const avatarUrl = u?.avatarUrl !== undefined ? u.avatarUrl : (m.avatarUrl || null);
    const name = u?.name || m.name;
    const nickname = u?.nickname || m.nickname;
    const currentStreak = u?.currentStreak || 0;

    let points = 0;
    let seconds = 0;

    switch (period) {
      case 'week':
        points = m.weekPoints || 0;
        seconds = m.weekStudySeconds || 0;
        break;
      case 'month':
        points = m.monthPoints || 0;
        seconds = m.monthStudySeconds || 0;
        break;
      case 'season':
        points = m.seasonPoints || 0;
        seconds = m.seasonStudySeconds || 0;
        break;
      case 'hours':
        points = m.totalPoints || 0;
        seconds = m.totalStudySeconds || 0;
        break;
      case 'all':
      default:
        points = m.totalPoints || 0;
        seconds = m.totalStudySeconds || 0;
        break;
    }

    const level = calculateLevel(m.totalStudySeconds || 0);

    return {
      uid: m.uid,
      name,
      nickname,
      avatarUrl,
      currentStreak,
      points,
      studySeconds: seconds,
      studyHours: Number((seconds / 3600).toFixed(2)),
      levelName: level.currentLevel.name,
      joinedAtMillis: m.joinedAt?.toMillis() || 0,
    };
  });

  // Ordenação com desempate rigoroso
  mapped.sort((a, b) => {
    if (period === 'hours') {
      // Ranking puramente de horas
      if (b.studySeconds !== a.studySeconds) {
        return b.studySeconds - a.studySeconds;
      }
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return a.joinedAtMillis - b.joinedAtMillis;
    }

    // Ranking padrão (Pontos DESC -> Segundos DESC -> Antiguidade ASC)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.studySeconds !== a.studySeconds) {
      return b.studySeconds - a.studySeconds;
    }
    return a.joinedAtMillis - b.joinedAtMillis;
  });

  // Atribuição de posições de rank
  const entries: LeaderboardEntry[] = mapped.map((item, index) => ({
    rank: index + 1,
    uid: item.uid,
    name: item.name,
    nickname: item.nickname,
    avatarUrl: item.avatarUrl,
    points: item.points,
    studySeconds: item.studySeconds,
    studyHours: item.studyHours,
    levelName: item.levelName,
    currentStreak: item.currentStreak,
  }));

  return {
    period,
    groupId,
    totalMembers: entries.length,
    entries,
  };
}
