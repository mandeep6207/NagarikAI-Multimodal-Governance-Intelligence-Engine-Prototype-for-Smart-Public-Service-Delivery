const BASE_URL = "http://localhost:8001/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
};

const getAuthHeaders = () => {
  if (typeof window === "undefined") {
    return {};
  }
  const token = localStorage.getItem("authToken") || "";
  const role = localStorage.getItem("userRole") || "";
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(role ? { "x-user-role": role } : {}),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiFetch = async (path: string, options: RequestOptions = {}): Promise<any> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message = payload?.detail || payload?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload;
};

// Helper for citizen endpoints that need x-citizen-id header
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiFetchWithCitizen = async (path: string, citizenId: string, options: RequestOptions = {}): Promise<any> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    "x-citizen-id": citizenId,
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;
  try { payload = await res.json(); } catch { payload = null; }
  if (!res.ok) {
    const message = payload?.detail || payload?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return payload;
};

export const api = {
  login: async (username: string, password: string, role: string) => apiFetch("/auth/login", { method: "POST", body: { username, password, role } }),

  fetchGovernanceScore: async () => apiFetch("/analytics/governance-score"),
  fetchForecast: async (district?: string) => apiFetch(`/analytics/forecast${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  fetchWorkload: async (district?: string) => apiFetch(`/analytics/workload${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  fetchKnowledgeGraph: async (district?: string) => apiFetch(`/analytics/knowledge-graph${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  fetchSystemOverview: async () => apiFetch("/analytics/system-overview"),
  fetchDistricts: async () => apiFetch("/workflow/districts"),

  simulateScenario: async (change: number) => apiFetch("/analytics/simulate-scenario", { method: "POST", body: { grievance_volume_change: change } }),

  discoverBeneficiaries: async (district?: string) => apiFetch(`/beneficiary/discover${district ? `?district=${encodeURIComponent(district)}` : ""}`, { method: "POST", body: {} }),

  analyzeGrievance: async (text: string, urgency: number) => apiFetch("/grievance/analyze", { method: "POST", body: { text, urgency } }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateCSC: async (payload: any) => apiFetch("/csc/validate", { method: "POST", body: payload }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCscApplication: async (payload: any) => apiFetch("/workflow/csc-submit", { method: "POST", body: payload }),
  fetchOfficerCases: async (district?: string, status?: string) => {
    const params: string[] = [];
    if (district) params.push(`district=${encodeURIComponent(district)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/workflow/officer-cases${query}`);
  },
  updateCaseStatus: async (caseId: string, action: "resolve" | "escalate") =>
    apiFetch(`/workflow/case/${encodeURIComponent(caseId)}/status`, { method: "POST", body: { action } }),

  // ── Super Administrator APIs ─────────────────────────────
  fetchSuperAdminDashboard: async () => apiFetch("/superadmin/dashboard"),
  fetchSuperAdminDistricts: async () => apiFetch("/superadmin/districts"),
  fetchDistrictDetail: async (district: string) => apiFetch(`/superadmin/district/${encodeURIComponent(district)}`),
  fetchSuperAdminGrievances: async (filters?: { district?: string; department?: string; priority?: string; status?: string }) => {
    const params: string[] = [];
    if (filters?.district) params.push(`district=${encodeURIComponent(filters.district)}`);
    if (filters?.department) params.push(`department=${encodeURIComponent(filters.department)}`);
    if (filters?.priority) params.push(`priority=${encodeURIComponent(filters.priority)}`);
    if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/superadmin/grievances${query}`);
  },
  fetchVideoComplaints: async () => apiFetch("/superadmin/video-complaints"),
  updateVideoComplaint: async (videoId: string, action: "verify" | "escalate") =>
    apiFetch(`/superadmin/video-complaints/${encodeURIComponent(videoId)}/action`, { method: "POST", body: { action } }),
  fetchSuperAdminOfficers: async (district?: string) =>
    apiFetch(`/superadmin/officers${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  reassignOfficer: async (officerId: string, newDistrict: string) =>
    apiFetch(`/superadmin/officers/${encodeURIComponent(officerId)}/reassign`, { method: "POST", body: { new_district: newDistrict } }),
  fetchSchemeAnalytics: async () => apiFetch("/superadmin/schemes"),
  fetchFraudAlerts: async () => apiFetch("/superadmin/fraud-alerts"),
  fetchAiInsights: async () => apiFetch("/superadmin/ai-insights"),

  // ── District Officer APIs ─────────────────────────────
  fetchOfficerDashboard: async (district?: string) =>
    apiFetch(`/officer/dashboard${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  fetchOfficerComplaints: async (filters?: { district?: string; department?: string; priority?: string; status?: string }) => {
    const params: string[] = [];
    if (filters?.district) params.push(`district=${encodeURIComponent(filters.district)}`);
    if (filters?.department) params.push(`department=${encodeURIComponent(filters.department)}`);
    if (filters?.priority) params.push(`priority=${encodeURIComponent(filters.priority)}`);
    if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/officer/complaints${query}`);
  },
  fetchOfficerComplaintDetail: async (id: string) =>
    apiFetch(`/officer/complaints/${encodeURIComponent(id)}`),
  officerComplaintAction: async (id: string, action: string, officerId?: string) =>
    apiFetch(`/officer/complaints/${encodeURIComponent(id)}/action`, { method: "POST", body: { action, officer_id: officerId } }),
  fetchOfficerVideoComplaints: async (district?: string) =>
    apiFetch(`/officer/video-complaints${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  officerVideoAction: async (videoId: string, action: "verify" | "escalate") =>
    apiFetch(`/officer/video-complaints/${encodeURIComponent(videoId)}/action`, { method: "POST", body: { action } }),
  fetchFieldOfficers: async (district?: string) =>
    apiFetch(`/officer/field-officers${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  assignComplaintToOfficer: async (complaintId: string, officerId: string) =>
    apiFetch("/officer/assign", { method: "POST", body: { complaint_id: complaintId, officer_id: officerId } }),
  fetchOfficerSchemeApplications: async (filters?: { district?: string; status?: string; scheme?: string }) => {
    const params: string[] = [];
    if (filters?.district) params.push(`district=${encodeURIComponent(filters.district)}`);
    if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters?.scheme) params.push(`scheme=${encodeURIComponent(filters.scheme)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/officer/scheme-applications${query}`);
  },
  officerSchemeAction: async (appId: string, action: string, remarks?: string) =>
    apiFetch(`/officer/scheme-applications/${encodeURIComponent(appId)}/action`, { method: "POST", body: { action, remarks } }),
  fetchOfficerAnalytics: async (district?: string) =>
    apiFetch(`/officer/analytics${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  fetchOfficerAiFeatures: async (district?: string) =>
    apiFetch(`/officer/ai-features${district ? `?district=${encodeURIComponent(district)}` : ""}`),

  // ── CSC Operator Portal APIs ─────────────────────────────
  fetchCscDashboard: async (district?: string) =>
    apiFetch(`/csc-portal/dashboard${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  fetchCscComplaints: async (filters?: { district?: string; status?: string }) => {
    const params: string[] = [];
    if (filters?.district) params.push(`district=${encodeURIComponent(filters.district)}`);
    if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/csc-portal/complaints${query}`);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCscComplaint: async (payload: any) =>
    apiFetch("/csc-portal/complaints", { method: "POST", body: payload }),
  fetchCscVideoComplaints: async (district?: string) =>
    apiFetch(`/csc-portal/video-complaints${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordCscVideoComplaint: async (payload: any) =>
    apiFetch("/csc-portal/video-complaints", { method: "POST", body: payload }),
  fetchCscDocuments: async (filters?: { district?: string; status?: string }) => {
    const params: string[] = [];
    if (filters?.district) params.push(`district=${encodeURIComponent(filters.district)}`);
    if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/csc-portal/documents${query}`);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadCscDocument: async (payload: any) =>
    apiFetch("/csc-portal/documents", { method: "POST", body: payload }),
  fetchCscSchemes: async () => apiFetch("/csc-portal/schemes"),
  fetchCscSchemeApplications: async (filters?: { district?: string; scheme?: string; status?: string }) => {
    const params: string[] = [];
    if (filters?.district) params.push(`district=${encodeURIComponent(filters.district)}`);
    if (filters?.scheme) params.push(`scheme=${encodeURIComponent(filters.scheme)}`);
    if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/csc-portal/scheme-applications${query}`);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCscSchemeApplication: async (payload: any) =>
    apiFetch("/csc-portal/scheme-applications", { method: "POST", body: payload }),
  fetchCscFraudAlerts: async (filters?: { district?: string; severity?: string }) => {
    const params: string[] = [];
    if (filters?.district) params.push(`district=${encodeURIComponent(filters.district)}`);
    if (filters?.severity) params.push(`severity=${encodeURIComponent(filters.severity)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiFetch(`/csc-portal/fraud-alerts${query}`);
  },
  fetchCscAiIntegrations: async () => apiFetch("/csc-portal/ai-integrations"),

  // ── Citizen Self-Service Portal APIs ────────────────────
  citizenLogin: async (mobile: string, otp: string = "1234") =>
    apiFetch("/citizen/login", { method: "POST", body: { mobile, otp } }),

  fetchCitizenProfile: async () => {
    const headers: Record<string, string> = { "x-citizen-id": localStorage.getItem("citizenId") || "" };
    const res = await fetch(`${BASE_URL}/citizen/profile`, { headers: { "Content-Type": "application/json", ...headers } });
    return res.json();
  },

  fetchCitizenDashboard: async () => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/dashboard", cid);
  },

  fetchCitizenComplaints: async (status?: string) => {
    const cid = localStorage.getItem("citizenId") || "";
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetchWithCitizen(`/citizen/complaints${q}`, cid);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCitizenComplaint: async (payload: any) => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/complaints", cid, { method: "POST", body: payload });
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCitizenVoiceComplaint: async (payload: any) => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/voice-complaint", cid, { method: "POST", body: payload });
  },

  fetchCitizenVideoComplaints: async () => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/video-complaints", cid);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCitizenVideoComplaint: async (payload: any) => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/video-complaints", cid, { method: "POST", body: payload });
  },

  fetchCitizenSchemes: async () => apiFetch("/citizen/schemes"),

  fetchCitizenApplications: async (status?: string) => {
    const cid = localStorage.getItem("citizenId") || "";
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetchWithCitizen(`/citizen/applications${q}`, cid);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCitizenApplication: async (payload: any) => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/applications", cid, { method: "POST", body: payload });
  },

  fetchCitizenDocuments: async (status?: string) => {
    const cid = localStorage.getItem("citizenId") || "";
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetchWithCitizen(`/citizen/documents${q}`, cid);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadCitizenDocument: async (payload: any) => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/documents", cid, { method: "POST", body: payload });
  },

  fetchCitizenNotifications: async (unreadOnly: boolean = false) => {
    const cid = localStorage.getItem("citizenId") || "";
    const q = unreadOnly ? "?unread_only=true" : "";
    return apiFetchWithCitizen(`/citizen/notifications${q}`, cid);
  },

  markCitizenNotificationRead: async (notificationId: string) => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/notifications/read", cid, { method: "POST", body: { notification_id: notificationId } });
  },

  fetchCitizenFraudStatus: async () => {
    const cid = localStorage.getItem("citizenId") || "";
    return apiFetchWithCitizen("/citizen/fraud-status", cid);
  },
};
