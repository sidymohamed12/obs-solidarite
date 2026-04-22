const normalizeBaseUrl = (value: string | undefined): string => {
  if (!value) {
    return 'http://localhost:8085';
  }

  return value.replace(/\/$/, '');
};

export const API_BASE_URL = normalizeBaseUrl(
  typeof globalThis !== 'undefined' ? (globalThis as { __env?: { apiBaseUrl?: string } }).__env?.apiBaseUrl : undefined
);

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/v1/web/auth/login`,
    logout: `${API_BASE_URL}/api/v1/web/auth/logout`,
    resetPassword: `${API_BASE_URL}/api/v1/web/auth/reset-password`,
    confirmResetOtp: `${API_BASE_URL}/api/v1/web/auth/reset-password/confirm-otp`,
    changePassword: `${API_BASE_URL}/api/v1/web/auth/change-password`,
    register: {
      citoyen: `${API_BASE_URL}/api/v1/web/auth/citoyen/register`,
      agent: `${API_BASE_URL}/api/v1/web/auth/register/agent`,
      admin: `${API_BASE_URL}/api/v1/web/auth/register/admin`,
    },
    verify: {
      citoyen: `${API_BASE_URL}/api/v1/web/auth/citoyen/verify`,
    },
  },
  utilisateurs: {
    adminAgents: `${API_BASE_URL}/api/v1/web/admin/utilisateurs/agents`,
    activate: (id: number | string) => `${API_BASE_URL}/api/v1/web/admin/utilisateurs/${id}/activer`,
    deactivate: (id: number | string) => `${API_BASE_URL}/api/v1/web/admin/utilisateurs/${id}/desactiver`,
  },
  demandes: {
    base: `${API_BASE_URL}/api/v1/web/citoyen/demandes`,
    agentBase: `${API_BASE_URL}/api/v1/web/agent/demandes`,
    adminBase: `${API_BASE_URL}/api/v1/web/admin/demandes`,
    byId: (id: number | string) => `${API_BASE_URL}/api/v1/web/citoyen/demandes/${id}`,
    agentById: (id: number | string) => `${API_BASE_URL}/api/v1/web/agent/demandes/${id}`,
    adminById: (id: number | string) => `${API_BASE_URL}/api/v1/web/admin/demandes/${id}`,
    takeInCharge: (id: number | string) =>
      `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/prendre-en-charge`,
    verify: (id: number | string) => `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/vérifier`,
    validate: (id: number | string) => `${API_BASE_URL}/api/v1/web/admin/demandes/${id}/valider`,
    adminReject: (id: number | string) => `${API_BASE_URL}/api/v1/web/admin/demandes/${id}/rejeter`,
    reject: (id: number | string) => `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/rejeter`,
    documents: (id: number | string) =>
      `${API_BASE_URL}/api/v1/web/citoyen/demandes/${id}/documents`,
    agentDocuments: (id: number | string) =>
      `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/documents`,
    downloadDocument: (id: number | string, documentId: number | string) =>
      `${API_BASE_URL}/api/v1/web/citoyen/demandes/${id}/documents/${documentId}/download`,
    agentDownloadDocument: (id: number | string, documentId: number | string) =>
      `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/documents/${documentId}/download`,
    adminDownloadDocument: (id: number | string, documentId: number | string) =>
      `${API_BASE_URL}/api/v1/web/admin/demandes/${id}/documents/${documentId}/download`,
  },
  categories: {
    base: `${API_BASE_URL}/api/v1/web/categories`,
    byId: (id: number | string) => `${API_BASE_URL}/api/v1/web/categories/${id}`,
  },
  programmes: {
    base: `${API_BASE_URL}/api/v1/web/programmes`,
    byId: (id: number | string) => `${API_BASE_URL}/api/v1/web/programmes/${id}`,
    byCategory: (category: string) =>
      `${API_BASE_URL}/api/v1/web/programmes?category=${encodeURIComponent(category)}`,
  },
  posts: {
    base: `${API_BASE_URL}/api/v1/web/posts`,
    byId: (id: number | string) => `${API_BASE_URL}/api/v1/web/posts/${id}`,
    byType: (typePost: string) =>
      `${API_BASE_URL}/api/v1/web/posts/type/${encodeURIComponent(typePost)}`,
    image: (id: number | string) => `${API_BASE_URL}/api/v1/web/posts/${id}/image`,
  },
};
