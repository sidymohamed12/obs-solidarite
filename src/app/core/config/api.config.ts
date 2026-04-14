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
    register: {
      citoyen: `${API_BASE_URL}/api/v1/web/auth/register/citoyen`,
      agent: `${API_BASE_URL}/api/v1/web/auth/register/agent`,
      admin: `${API_BASE_URL}/api/v1/web/auth/register/admin`,
    },
  },
  demandes: {
    base: `${API_BASE_URL}/api/v1/web/citoyen/demandes`,
    agentBase: `${API_BASE_URL}/api/v1/web/agent/demandes`,
    byId: (id: number | string) => `${API_BASE_URL}/api/v1/web/citoyen/demandes/${id}`,
    takeInCharge: (id: number | string) =>
      `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/prendre-en-charge`,
    verify: (id: number | string) => `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/vérifier`,
    reject: (id: number | string) => `${API_BASE_URL}/api/v1/web/agent/demandes/${id}/rejeter`,
    documents: (id: number | string) =>
      `${API_BASE_URL}/api/v1/web/citoyen/demandes/${id}/documents`,
    downloadDocument: (id: number | string, documentId: number | string) =>
      `${API_BASE_URL}/api/v1/web/citoyen/demandes/${id}/documents/${documentId}/download`,
  },
  categories: {
    base: `${API_BASE_URL}/api/v1/web/categories`,
  },
  programmes: {
    base: `${API_BASE_URL}/api/v1/web/programmes`,
    byCategory: (category: string) =>
      `${API_BASE_URL}/api/v1/web/programmes?category=${encodeURIComponent(category)}`,
  },
};
