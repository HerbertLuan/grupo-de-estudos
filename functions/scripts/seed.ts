import * as admin from 'firebase-admin';
import { DEFAULT_BADGES, DEFAULT_LEVELS, DEFAULT_TIMEZONE } from '../src/config/constants';
import { Group, GroupMember, Season, UserProfile } from '../src/types';
import { getCurrentMonthId, getCurrentWeekId } from '../src/utils/timezone';

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  'grupo-de-estudos-4b504';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
  });
}

const db = admin.firestore();

async function seed() {
  console.log('🌱 Iniciando Seed do Banco de Dados Firebase...');

  // 1. Catálogo de Níveis
  console.log('📌 Populando níveis...');
  const levelBatch = db.batch();
  for (const lvl of DEFAULT_LEVELS) {
    const ref = db.collection('levels').doc(lvl.id);
    levelBatch.set(ref, lvl);
  }
  await levelBatch.commit();

  // 2. Catálogo de Badges
  console.log('📌 Populando badges...');
  const badgeBatch = db.batch();
  for (const b of DEFAULT_BADGES) {
    const ref = db.collection('badges').doc(b.id);
    badgeBatch.set(ref, b);
  }
  await badgeBatch.commit();

  // 3. Temporada Padrão
  console.log('📌 Populando temporada...');
  const seasonId = 'season-2026-09';
  const now = admin.firestore.Timestamp.now();
  const defaultSeason: Season = {
    id: seasonId,
    groupId: 'demo-group',
    name: 'Temporada Setembro 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    active: true,
    createdAt: now,
  };
  await db.collection('seasons').doc(seasonId).set(defaultSeason);

  // 4. Grupo Privado Principal
  console.log('📌 Populando grupo privado...');
  const groupId = 'demo-group';
  const group: Group = {
    id: groupId,
    name: 'Grupo de Estudos Alfa',
    inviteCode: 'ESTUDO10',
    timezone: DEFAULT_TIMEZONE,
    ownerId: 'user-joao',
    memberCount: 10,
    activeSeasonId: seasonId,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('groups').doc(groupId).set(group);

  // 5. 10 Usuários de Demonstração (com dados para ranking e desempate)
  console.log('📌 Populando 10 membros com históricos para ranking...');
  const weekId = getCurrentWeekId(now.toDate(), DEFAULT_TIMEZONE);
  const monthId = getCurrentMonthId(now.toDate(), DEFAULT_TIMEZONE);

  const demoMembers = [
    { uid: 'user-joao', name: 'João Silva', nickname: 'joao_estudos', points: 37, hours: 82, streak: 12 },
    { uid: 'user-maria', name: 'Maria Oliveira', nickname: 'maria_foco', points: 36, hours: 91, streak: 15 },
    { uid: 'user-pedro', name: 'Pedro Santos', nickname: 'pedro_concurso', points: 36, hours: 87, streak: 8 },
    { uid: 'user-ana', name: 'Ana Costa', nickname: 'ana_dev', points: 28, hours: 65, streak: 5 },
    { uid: 'user-lucas', name: 'Lucas Lima', nickname: 'lucas_med', points: 25, hours: 55, streak: 6 },
    { uid: 'user-bia', name: 'Beatriz Ramos', nickname: 'bia_direito', points: 20, hours: 45, streak: 4 },
    { uid: 'user-gabriel', name: 'Gabriel Souza', nickname: 'gabriel_eng', points: 18, hours: 38, streak: 3 },
    { uid: 'user-lari', name: 'Larissa Rocha', nickname: 'lari_psi', points: 15, hours: 30, streak: 2 },
    { uid: 'user-rodrigo', name: 'Rodrigo Alves', nickname: 'rodrigo_ti', points: 12, hours: 22, streak: 1 },
    { uid: 'user-camila', name: 'Camila Dias', nickname: 'camila_adm', points: 8, hours: 14, streak: 0 },
  ];

  for (const m of demoMembers) {
    const totalSeconds = m.hours * 3600;

    // Nickname lock
    await db.collection('nicknames').doc(m.nickname.toLowerCase()).set({
      uid: m.uid,
      nickname: m.nickname,
      createdAt: now,
    });

    // Profile
    const profile: UserProfile = {
      uid: m.uid,
      name: m.name,
      nickname: m.nickname,
      avatarUrl: null,
      groupId: groupId,
      active: true,
      activeSessionId: null,
      totalPoints: m.points,
      totalStudySeconds: totalSeconds,
      currentStreak: m.streak,
      longestStreak: m.streak + 3,
      lastCompletedDate: '2026-09-08',
      levelId: totalSeconds >= 180000 ? 'disciplinado' : totalSeconds >= 90000 ? 'dedicado' : 'aprendiz',
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('users').doc(m.uid).set(profile);

    // Group Member
    const member: GroupMember = {
      uid: m.uid,
      groupId: groupId,
      name: m.name,
      nickname: m.nickname,
      avatarUrl: null,
      role: m.uid === 'user-joao' ? 'admin' : 'member',
      joinedAt: now,
      totalPoints: m.points,
      totalStudySeconds: totalSeconds,
      weekPoints: Math.min(5, m.points),
      weekStudySeconds: Math.floor(totalSeconds / 5),
      weekId,
      monthPoints: m.points,
      monthStudySeconds: totalSeconds,
      monthId,
      seasonPoints: m.points,
      seasonStudySeconds: totalSeconds,
      seasonId,
      updatedAt: now,
    };
    await db.collection('groups').doc(groupId).collection('members').doc(m.uid).set(member);

    // Registro diário de hoje: 1h15 (4500s) -> 1 ponto
    await db
      .collection('users')
      .doc(m.uid)
      .collection('dailyStudy')
      .doc('2026-09-08')
      .set({
        id: '2026-09-08',
        userId: m.uid,
        groupId: groupId,
        date: '2026-09-08',
        totalSeconds: 4500,
        totalSessions: 2,
        pointEarned: true,
        pointEarnedAt: now,
        updatedAt: now,
      });

    // Subcoleção de badge: First Point
    await db
      .collection('users')
      .doc(m.uid)
      .collection('badges')
      .doc('first_point')
      .set({
        id: 'first_point',
        badgeId: 'first_point',
        name: 'Primeiro Ponto',
        description: 'Conquistou o seu primeiro ponto diário.',
        icon: '🌟',
        unlockedAt: now,
      });
  }

  // 6. Post inicial de boas-vindas no feed
  console.log('📌 Criando post inicial no feed...');
  await db.collection('feed').doc('welcome-post').set({
    id: 'welcome-post',
    groupId,
    userId: 'user-joao',
    userNickname: 'joao_estudos',
    userAvatarUrl: null,
    type: 'manual_post',
    title: 'Bem-vindos ao Grupo de Estudos!',
    message: 'A temporada começou! Lembrem-se: 60 minutos de estudo garantem seu ponto diário. Bom foco a todos! 🚀',
    metadata: {},
    likeCount: 5,
    commentCount: 1,
    createdAt: now,
  });

  // Comentário inicial
  await db.collection('feed').doc('welcome-post').collection('comments').doc('c1').set({
    id: 'c1',
    postId: 'welcome-post',
    userId: 'user-maria',
    userNickname: 'maria_foco',
    userAvatarUrl: null,
    content: 'Bora estudar! Rumo ao topo! 📚🔥',
    createdAt: now,
    updatedAt: now,
  });

  console.log('✅ Seed finalizado com sucesso!');
}

seed().catch((err) => {
  console.error('❌ Erro durante o seed:', err);
  process.exit(1);
});
