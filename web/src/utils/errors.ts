/**
 * Mapeamento de códigos de erro do Firebase para mensagens amigáveis em português
 */

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'unauthenticated': 'Você precisa estar autenticado para realizar esta ação.',
  'permission-denied': 'Você não tem permissão para realizar esta ação.',
  'not-found': 'O recurso solicitado não foi encontrado.',
  'already-exists': 'O recurso informado já existe.',
  'failed-precondition': 'A operação não pôde ser executada devido ao estado atual.',
  'invalid-argument': 'Dados inválidos fornecidos. Verifique os campos e tente novamente.',
  'internal': 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
  'unavailable': 'Serviço temporariamente indisponível. Verifique sua conexão e tente novamente.',
  'auth/wrong-password': 'Senha incorreta. Verifique os dados digitados.',
  'auth/user-not-found': 'Usuário não encontrado. Verifique o e-mail digitado.',
  'auth/too-many-requests': 'Muitas tentativas consecutivas. Tente novamente mais tarde.',
  'auth/network-request-failed': 'Falha na conexão com a rede. Verifique sua internet.',

  // Erros adicionais frequentes de autenticação e rede
  'auth/invalid-credential': 'Credenciais inválidas. Verifique seu e-mail e senha.',
  'auth/email-already-in-use': 'Este e-mail já está em uso por outra conta.',
  'auth/weak-password': 'A senha é muito fraca. Escolha uma senha com pelo menos 6 caracteres.',
  'auth/invalid-email': 'O endereço de e-mail informado é inválido.',
  'auth/user-disabled': 'Esta conta de usuário foi desativada.',
  'auth/popup-closed-by-user': 'A autenticação foi cancelada pelo usuário.',
  'resource-exhausted': 'Limite de requisições excedido. Aguarde alguns instantes.',
  'deadline-exceeded': 'O tempo limite da requisição foi excedido. Tente novamente.',
  'cancelled': 'A operação foi cancelada.',
};

const DEFAULT_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

/**
 * Mapeia erros do Firebase (Auth, Firestore, Cloud Functions) para mensagens legíveis em português
 */
export function mapFirebaseError(error: unknown): string {
  if (!error) {
    return DEFAULT_ERROR_MESSAGE;
  }

  let rawCode = '';

  if (typeof error === 'string') {
    rawCode = error;
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as { code?: unknown; error?: { code?: unknown }; message?: unknown };
    if (typeof errObj.code === 'string') {
      rawCode = errObj.code;
    } else if (errObj.error && typeof errObj.error.code === 'string') {
      rawCode = errObj.error.code;
    }
  }

  if (rawCode) {
    // Busca exata pelo código (ex: 'auth/wrong-password', 'permission-denied')
    if (FIREBASE_ERROR_MAP[rawCode]) {
      return FIREBASE_ERROR_MAP[rawCode];
    }

    // Remove prefixos comuns de SDK como 'functions/' ou 'firestore/'
    const normalizedCode = rawCode.replace(/^(functions|firestore)\//, '').trim();
    if (FIREBASE_ERROR_MAP[normalizedCode]) {
      return FIREBASE_ERROR_MAP[normalizedCode];
    }
  }

  // Se houver uma mensagem personalizada de erro retornada pelas Cloud Functions
  if (typeof error === 'object' && error !== null) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      // Ignora mensagens padrão de erro de infraestrutura do Firebase SDK
      const isSdkGenericMessage =
        message.startsWith('Firebase:') ||
        message.startsWith('INTERNAL') ||
        message.includes('execute function');
      if (!isSdkGenericMessage) {
        return message;
      }
    }
  }

  return DEFAULT_ERROR_MESSAGE;
}
