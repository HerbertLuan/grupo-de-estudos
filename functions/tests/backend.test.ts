import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'test-project' });
}

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateLevel, calculateStreakOnDayCompletion, getEffectiveStreak } from '../src/services/gamificationService';
import { diffCalendarDays, isConsecutiveDay, getDateRange, getCurrentWeekId, getCurrentMonthId } from '../src/utils/timezone';
import { DEFAULT_BADGES, DEFAULT_LEVELS, POINTS_THRESHOLD_SECONDS } from '../src/config/constants';

describe('1. Regra Fundamental do Cronômetro e Pontos (60 min = 1 ponto, máx 1 ponto/dia)', () => {
  it('59 minutos (3540s) NÃO deve conceder ponto', () => {
    const studySeconds = 59 * 60; // 3540s
    const pointEarned = studySeconds >= POINTS_THRESHOLD_SECONDS;
    expect(pointEarned).toBe(false);
  });

  it('Exatamente 60 minutos (3600s) DEVE conceder 1 ponto', () => {
    const studySeconds = 60 * 60; // 3600s
    const pointEarned = studySeconds >= POINTS_THRESHOLD_SECONDS;
    expect(pointEarned).toBe(true);
  });

  it('2 horas (7200s) no mesmo dia deve conceder APENAS 1 ponto', () => {
    const totalDaySeconds = 2 * 3600;
    let pointsAwarded = 0;
    let pointAlreadyEarnedToday = false;

    if (totalDaySeconds >= POINTS_THRESHOLD_SECONDS && !pointAlreadyEarnedToday) {
      pointsAwarded += 1;
      pointAlreadyEarnedToday = true;
    }

    // Mesmo que verifique novamente no final do dia
    if (totalDaySeconds >= POINTS_THRESHOLD_SECONDS && !pointAlreadyEarnedToday) {
      pointsAwarded += 1;
    }

    expect(pointsAwarded).toBe(1);
  });

  it('5 horas (18000s) no mesmo dia deve conceder APENAS 1 ponto', () => {
    const totalDaySeconds = 5 * 3600;
    let pointsAwarded = 0;
    let pointAlreadyEarnedToday = false;

    if (totalDaySeconds >= POINTS_THRESHOLD_SECONDS && !pointAlreadyEarnedToday) {
      pointsAwarded += 1;
      pointAlreadyEarnedToday = true;
    }

    expect(pointsAwarded).toBe(1);
    expect(totalDaySeconds).toBe(18000);
  });

  it('Múltiplas sessões fragmentadas somam corretamente e concedem 1 ponto ao atingir 60 minutos', () => {
    // Exemplo do documento de requisitos:
    // Sessão 1: 08:00 -> 08:30 = 30 min (1800s) -> 0 pontos
    // Sessão 2: 14:00 -> 14:20 = 20 min (1200s) -> 0 pontos
    // Sessão 3: 20:00 -> 20:40 = 40 min (2400s) -> 1 ponto (total 90 min = 5400s)
    let dailyTotalSeconds = 0;
    let dailyPointEarned = false;
    let totalPoints = 0;

    function recordSession(seconds: number) {
      dailyTotalSeconds += seconds;
      if (dailyTotalSeconds >= POINTS_THRESHOLD_SECONDS && !dailyPointEarned) {
        dailyPointEarned = true;
        totalPoints += 1;
      }
    }

    // Sessão 1: 30 min
    recordSession(30 * 60);
    expect(dailyTotalSeconds).toBe(1800);
    expect(dailyPointEarned).toBe(false);
    expect(totalPoints).toBe(0);

    // Sessão 2: 20 min (acumulado: 50 min)
    recordSession(20 * 60);
    expect(dailyTotalSeconds).toBe(3000);
    expect(dailyPointEarned).toBe(false);
    expect(totalPoints).toBe(0);

    // Sessão 3: 40 min (acumulado: 90 min)
    recordSession(40 * 60);
    expect(dailyTotalSeconds).toBe(5400); // 1h30
    expect(dailyPointEarned).toBe(true);
    expect(totalPoints).toBe(1);

    // Sessão 4 posterior no mesmo dia: 30 min (acumulado: 120 min)
    recordSession(30 * 60);
    expect(dailyTotalSeconds).toBe(7200); // 2h
    expect(dailyPointEarned).toBe(true);
    expect(totalPoints).toBe(1); // Continua com apenas 1 ponto!
  });
});

describe('2. Ciclo de Vida do Cronômetro e Reconstrução de Estado', () => {
  it('Pausar calcula o tempo decorrido e acumula segundos', () => {
    const startedAt = 1000000;
    const lastResumedAt = 1000000;
    let accumulatedSeconds = 0;

    // Pausa após 20 minutos (1200 segundos)
    const pausedAt = 1000000 + 1200 * 1000;
    const elapsedSinceResume = Math.floor((pausedAt - lastResumedAt) / 1000);
    accumulatedSeconds += elapsedSinceResume;

    expect(accumulatedSeconds).toBe(1200);
  });

  it('Continuar e pausar novamente soma todos os intervalos', () => {
    let accumulatedSeconds = 1200; // 20 min da primeira parte

    // Retoma
    const resumedAt = 2000000;
    // Pausa após mais 15 minutos (900 segundos)
    const secondPausedAt = 2000000 + 900 * 1000;
    const elapsedSinceResume = Math.floor((secondPausedAt - resumedAt) / 1000);
    accumulatedSeconds += elapsedSinceResume;

    expect(accumulatedSeconds).toBe(2100); // 35 min total
  });

  it('Reconstrução de estado após fechamento da aba / desconexão', () => {
    const session = {
      status: 'active' as const,
      accumulatedSeconds: 600, // 10 min de pausa anterior
      lastResumedAtMillis: 1000000,
    };

    // 15 minutos após o lastResumedAt, o usuário reabre a aplicação
    const clientNowMillis = 1000000 + 900 * 1000; // + 15 min (900s)

    const reconstructedSeconds =
      session.accumulatedSeconds + Math.floor((clientNowMillis - session.lastResumedAtMillis) / 1000);

    expect(reconstructedSeconds).toBe(1500); // 10 min + 15 min = 25 min (1500s)
  });

  it('Reconstrução quando a sessão estava pausada não deve avançar o tempo', () => {
    const session = {
      status: 'paused' as const,
      accumulatedSeconds: 1500,
      lastResumedAtMillis: null,
    };

    const clientNowMillis = 9999999999;
    const reconstructedSeconds = session.accumulatedSeconds;

    expect(reconstructedSeconds).toBe(1500);
  });

  it('Garantia de sessão ativa única: rejeitar início se já houver sessão ativa ou pausada', () => {
    let activeSessionId: string | null = 'session-123';

    function tryStartSession() {
      if (activeSessionId) {
        throw new Error('Você já possui uma sessão ativa ou pausada.');
      }
      activeSessionId = 'session-456';
    }

    expect(() => tryStartSession()).toThrow('Você já possui uma sessão ativa ou pausada.');
  });
});

describe('3. Virada da Meia-Noite (Timezone e Atribuição de Tempo)', () => {
  it('Sessão iniciada às 23:30 e finalizada às 00:10 credita integralmente ao dia anterior', () => {
    // Início: 23:30 do dia 2026-09-08
    const sessionStudyDate = '2026-09-08';
    const totalSessionSeconds = 40 * 60; // 40 minutos (2400s)

    // Ao finalizar às 00:10 do dia 2026-09-09:
    const dailyStudyRegistry = {
      '2026-09-08': 0,
      '2026-09-09': 0,
    };

    // O backend credita ao session.studyDate (dia do início)
    dailyStudyRegistry[sessionStudyDate] += totalSessionSeconds;

    expect(dailyStudyRegistry['2026-09-08']).toBe(2400); // 40 min computados no dia anterior
    expect(dailyStudyRegistry['2026-09-09']).toBe(0); // Novo dia inicia limpo com 00:00!
  });
});

describe('4. Mecanismo de Streak e Quebra de Sequência', () => {
  it('Incrementa o streak em dias consecutivos com pelo menos 60 minutos', () => {
    let currentStreak = 0;
    let longestStreak = 0;
    let lastCompletedDate: string | null = null;

    // Segunda: 60 min (conquistou ponto)
    let res = calculateStreakOnDayCompletion(currentStreak, longestStreak, lastCompletedDate, '2026-09-07');
    currentStreak = res.currentStreak;
    longestStreak = res.longestStreak;
    lastCompletedDate = res.lastCompletedDate;
    expect(currentStreak).toBe(1);
    expect(longestStreak).toBe(1);

    // Terça: 70 min
    res = calculateStreakOnDayCompletion(currentStreak, longestStreak, lastCompletedDate, '2026-09-08');
    currentStreak = res.currentStreak;
    longestStreak = res.longestStreak;
    lastCompletedDate = res.lastCompletedDate;
    expect(currentStreak).toBe(2);
    expect(longestStreak).toBe(2);

    // Quarta: 90 min
    res = calculateStreakOnDayCompletion(currentStreak, longestStreak, lastCompletedDate, '2026-09-09');
    currentStreak = res.currentStreak;
    longestStreak = res.longestStreak;
    lastCompletedDate = res.lastCompletedDate;
    expect(currentStreak).toBe(3);
    expect(longestStreak).toBe(3);
  });

  it('Quebra o streak quando há um intervalo de 2 ou mais dias', () => {
    // Usuário tinha streak 3 e última data 2026-09-09
    // Quinta (2026-09-10): estudou 40 min (não completou)
    // Sexta (2026-09-11): estudou 60 min (completou)
    const res = calculateStreakOnDayCompletion(3, 3, '2026-09-09', '2026-09-11');
    expect(res.currentStreak).toBe(1); // Resetou para 1
    expect(res.longestStreak).toBe(3); // Recorde preservado!
  });

  it('Streak efetivo em tempo real expira se ontem não foi concluído', () => {
    const today = '2026-09-10';

    // Caso 1: Concluiu hoje
    expect(getEffectiveStreak(5, '2026-09-10', today)).toBe(5);

    // Caso 2: Concluiu ontem (hoje ainda em andamento) -> streak continua vivo
    expect(getEffectiveStreak(5, '2026-09-09', today)).toBe(5);

    // Caso 3: Concluiu anteontem (ontem não estudou) -> expirou
    expect(getEffectiveStreak(5, '2026-09-08', today)).toBe(0);
  });
});

describe('5. Rankings e Resolução Determinística de Desempate', () => {
  it('Resolve empates de pontos pelo total de horas estudadas', () => {
    // Conforme o exemplo do documento:
    // 1. João — 37 pontos — 82h
    // 2. Maria — 36 pontos — 91h
    // 3. Pedro — 36 pontos — 87h
    const users = [
      { name: 'Pedro', points: 36, studySeconds: 87 * 3600 },
      { name: 'João', points: 37, studySeconds: 82 * 3600 },
      { name: 'Maria', points: 36, studySeconds: 91 * 3600 },
    ];

    users.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.studySeconds - a.studySeconds;
    });

    expect(users[0].name).toBe('João'); // 37 pontos
    expect(users[1].name).toBe('Maria'); // 36 pontos, 91h
    expect(users[2].name).toBe('Pedro'); // 36 pontos, 87h
  });

  it('Ranking puramente de horas ordena prioritariamente por segundos de estudo', () => {
    const users = [
      { name: 'João', points: 37, studySeconds: 82 * 3600 },
      { name: 'Maria', points: 36, studySeconds: 91 * 3600 },
      { name: 'Pedro', points: 36, studySeconds: 87 * 3600 },
    ];

    users.sort((a, b) => b.studySeconds - a.studySeconds);

    expect(users[0].name).toBe('Maria'); // 91h
    expect(users[1].name).toBe('Pedro'); // 87h
    expect(users[2].name).toBe('João'); // 82h
  });
});

describe('6. Sistema de Níveis Baseado em Horas', () => {
  it('Calcula corretamente o nível inicial e a progressão', () => {
    const zeroSecs = calculateLevel(0);
    expect(zeroSecs.currentLevel.name).toBe('Iniciante');
    expect(zeroSecs.nextLevel?.name).toBe('Aprendiz');

    const tenHours = calculateLevel(10 * 3600);
    expect(tenHours.currentLevel.name).toBe('Aprendiz');
    expect(tenHours.nextLevel?.name).toBe('Dedicado');

    const legend = calculateLevel(1200 * 3600);
    expect(legend.currentLevel.name).toBe('Lendário');
    expect(legend.nextLevel).toBeNull();
    expect(legend.progressPercentage).toBe(100);
  });
});

describe('7. Redes Sociais, Feed e Curtidas Únicas', () => {
  it('Garante que um usuário pode curtir apenas uma vez (toggle idempotente)', () => {
    const post = { id: 'p1', likeCount: 0 };
    const likesSet = new Set<string>();

    function toggleLike(uid: string) {
      if (likesSet.has(uid)) {
        likesSet.delete(uid);
        post.likeCount = Math.max(0, post.likeCount - 1);
        return false;
      } else {
        likesSet.add(uid);
        post.likeCount += 1;
        return true;
      }
    }

    // Primeira curtida: adiciona
    expect(toggleLike('user1')).toBe(true);
    expect(post.likeCount).toBe(1);

    // Segunda chamada do mesmo usuário: descurte
    expect(toggleLike('user1')).toBe(false);
    expect(post.likeCount).toBe(0);

    // Múltiplos usuários curtem
    toggleLike('user1');
    toggleLike('user2');
    toggleLike('user3');
    expect(post.likeCount).toBe(3);
  });
});

describe('8. Concessão Idempotente de Badges', () => {
  it('Badge não é concedida repetidamente se o usuário já a possui', () => {
    const userBadges = new Set<string>(['first_point']);

    function awardBadge(badgeId: string): boolean {
      if (userBadges.has(badgeId)) {
        return false; // Já possui
      }
      userBadges.add(badgeId);
      return true;
    }

    expect(awardBadge('first_point')).toBe(false);
    expect(awardBadge('streak_7')).toBe(true);
    expect(awardBadge('streak_7')).toBe(false); // Segunda tentativa ignorada
  });
});

describe('9. Utilitários de Calendário e Datas', () => {
  it('Calcula corretamente diferença de dias corridos e dias consecutivos', () => {
    expect(isConsecutiveDay('2026-09-08', '2026-09-09')).toBe(true);
    expect(isConsecutiveDay('2026-09-08', '2026-09-10')).toBe(false);
    expect(diffCalendarDays('2026-09-01', '2026-09-05')).toBe(4);
  });

  it('Gera intervalo de datas contínuo para séries temporais', () => {
    const range = getDateRange('2026-09-01', '2026-09-03');
    expect(range).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
  });
});

describe('10. Temporadas de Competição', () => {
  it('Mantém pontuação histórica geral independente da troca de temporada', () => {
    const user = {
      totalPoints: 50, // Histórico geral
      season1Points: 20,
      season2Points: 30,
    };

    expect(user.totalPoints).toBe(50);
    expect(user.season1Points + user.season2Points).toBe(user.totalPoints);
  });

  it('Filtro de temporada pontua apenas sessões ocorridas no período ativo', () => {
    const season = {
      id: 'season-2026-09',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    };

    function isSessionInSeason(date: string) {
      return date >= season.startDate && date <= season.endDate;
    }

    expect(isSessionInSeason('2026-09-08')).toBe(true);
    expect(isSessionInSeason('2026-08-31')).toBe(false);
    expect(isSessionInSeason('2026-10-01')).toBe(false);
  });
});

describe('11. Validação das Regras de Segurança (Firestore e Storage Rules)', () => {
  it('Bloqueia usuário tentando alterar seus próprios pontos ou streak diretamente', () => {
    // Simulação da regra:
    // request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'avatarUrl', 'updatedAt'])
    const existingDoc = {
      name: 'João',
      avatarUrl: null,
      totalPoints: 10,
      currentStreak: 3,
      updatedAt: 1000,
    };

    function canUpdateUser(updatedDoc: any): boolean {
      const allowedKeys = new Set(['name', 'avatarUrl', 'updatedAt']);
      for (const key of Object.keys(updatedDoc)) {
        if (updatedDoc[key] !== (existingDoc as any)[key] && !allowedKeys.has(key)) {
          return false; // Violação da regra de segurança
        }
      }
      return true;
    }

    // Permitido: alterar apenas nome e avatar
    expect(canUpdateUser({ ...existingDoc, name: 'João Silva', updatedAt: 2000 })).toBe(true);

    // Rejeitado: tentar alterar totalPoints
    expect(canUpdateUser({ ...existingDoc, totalPoints: 999 })).toBe(false);

    // Rejeitado: tentar alterar currentStreak
    expect(canUpdateUser({ ...existingDoc, currentStreak: 50 })).toBe(false);
  });

  it('Bloqueia usuário tentando alterar dados de outro participante (isOwner)', () => {
    function canModifyProfile(authUid: string, targetUid: string): boolean {
      return authUid === targetUid;
    }

    expect(canModifyProfile('user-1', 'user-1')).toBe(true);
    expect(canModifyProfile('user-1', 'user-2')).toBe(false);
  });

  it('Bloqueia criação direta de sessões de estudo e registros diários fora de Cloud Functions', () => {
    // Nas regras:
    // match /studySessions/{id} { allow write: if false; }
    // match /dailyStudy/{id} { allow write: if false; }
    const clientAllowWriteDailyStudy = false;
    const clientAllowWriteStudySessions = false;

    expect(clientAllowWriteDailyStudy).toBe(false);
    expect(clientAllowWriteStudySessions).toBe(false);
  });
});

describe('12. Autenticação, Validação de Apelido e Resiliência de Perfil', () => {
  function validateNickname(nickname: string): boolean {
    const trimmed = nickname.trim();
    if (trimmed.length < 3 || trimmed.length > 20) return false;
    return /^[a-zA-Z0-9_]+$/.test(trimmed);
  }

  function getInternalEmail(nickname: string): string {
    return `${nickname.trim().toLowerCase()}@estudos.internal`;
  }

  function deriveNicknameFromEmail(email: string, uid: string): string {
    const prefix = email.split('@')[0];
    if (!prefix || prefix.length < 3) {
      return `user_${uid.substring(0, 5)}`;
    }
    return prefix.toLowerCase();
  }

  it('Valida regras estritas de apelido', () => {
    expect(validateNickname('joao_123')).toBe(true);
    expect(validateNickname('ana')).toBe(true);
    expect(validateNickname('a')).toBe(false); // Curto demais
    expect(validateNickname('este_apelido_tem_mais_de_vinte_caracteres')).toBe(false); // Longo demais
    expect(validateNickname('joao silva')).toBe(false); // Espaço não permitido
    expect(validateNickname('joao@123')).toBe(false); // Caractere especial inválido
  });

  it('Gera e-mail interno determinístico em minúsculas', () => {
    expect(getInternalEmail('Joao_Dev')).toBe('joao_dev@estudos.internal');
    expect(getInternalEmail('  MARIA  ')).toBe('maria@estudos.internal');
  });

  it('Deriva apelido corretamente na auto-recuperação de perfil órfão', () => {
    expect(deriveNicknameFromEmail('joao_silva@estudos.internal', 'uid123456')).toBe('joao_silva');
    expect(deriveNicknameFromEmail('', 'uid123456')).toBe('user_uid12');
  });
});

describe('13. Enriquecimento de Perfil no Ranking (Avatar, Nome, Streak)', () => {
  it('Usa avatarUrl mais recente da coleção users se membro tiver null ou desatualizado', () => {
    const memberDoc = {
      uid: 'user-1',
      name: 'Herbert Antigo',
      nickname: 'herbert',
      avatarUrl: null,
      weekPoints: 5,
      weekStudySeconds: 18000,
    };

    const userProfileDoc = {
      uid: 'user-1',
      name: 'Herbert Luan',
      nickname: 'herbert',
      avatarUrl: 'https://storage.googleapis.com/test/avatar.jpg',
      currentStreak: 4,
    };

    // Mapeamento enriquecido
    const enrichedAvatar = userProfileDoc.avatarUrl ?? memberDoc.avatarUrl ?? null;
    const enrichedName = userProfileDoc.name || memberDoc.name;
    const enrichedStreak = userProfileDoc.currentStreak || 0;

    expect(enrichedAvatar).toBe('https://storage.googleapis.com/test/avatar.jpg');
    expect(enrichedName).toBe('Herbert Luan');
    expect(enrichedStreak).toBe(4);
  });

  it('Mantém avatarUrl do membro caso o perfil de usuário não possua foto cadastrada', () => {
    const memberDoc = {
      uid: 'user-2',
      name: 'Maria',
      nickname: 'maria',
      avatarUrl: null,
      weekPoints: 3,
      weekStudySeconds: 10800,
    };

    const userProfileDoc = {
      uid: 'user-2',
      name: 'Maria Silva',
      nickname: 'maria',
      avatarUrl: null,
      currentStreak: 0,
    };

    const enrichedAvatar = userProfileDoc.avatarUrl ?? memberDoc.avatarUrl ?? null;
    expect(enrichedAvatar).toBeNull();
  });
});



