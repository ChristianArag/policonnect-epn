export type UserRole = "ADMIN" | "EPN_STUDENT" | "EXTERNAL";

export type FISCareer =
  | "Software"
  | "Sistemas de Información"
  | "Computación"
  | "Ciencias de Datos";

export type ApplicationStatus =
  | "En revisión"
  | "Entrevistado"
  | "Seleccionado"
  | "Rechazado";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  career: FISCareer | null;
  institution: string;
  headline: string | null;
  experience_summary: string | null;
  education_level: string | null;
  skills: string[];
  tags: string[];
  avatar_url: string | null;
  cv_filename: string | null;
  cv_updated_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface TagItem {
  id: number;
  name: string;
  category: string;
  demand_count?: number;
}

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  modality: string;
  vacancies: number;
  description: string;
  salary_range: string;
  created_by: number | null;
  is_active: boolean;
  created_at: string;
  tags: string[];
  applicant_count: number;
  match_score?: number;
  matching_tags?: string[];
  has_applied?: boolean;
  my_application_status?: ApplicationStatus | null;
}

export interface JobApplication {
  id: number;
  job_id: number;
  user_id: number;
  status: ApplicationStatus;
  match_score: number;
  applied_at: string;
  updated_at: string;
  job_title?: string;
  company?: string;
  location?: string;
  modality?: string;
  job_tags?: string[];
  candidate_name?: string;
  candidate_email?: string;
  candidate_role?: UserRole;
  candidate_career?: FISCareer | null;
  candidate_institution?: string;
  candidate_headline?: string | null;
  candidate_education?: string | null;
  candidate_skills?: string[];
  candidate_tags?: string[];
  candidate_cv?: string | null;
  candidate_avatar?: string | null;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  application_id: number | null;
  title: string;
  message: string;
  status_badge: ApplicationStatus | string | null;
  is_read: boolean;
  created_at: string;
}

export interface ParsedCVResult {
  nombre: string;
  titularProfesional: string;
  experiencia: string;
  habilidadesPrincipales: string[];
  nivelEstudios: string;
  carreraDetectada: FISCareer | null;
  esEstudianteEPN: boolean;
  tagsSugeridos: string[];
}

export interface AdminStats {
  byCareer: { career: string; postulantes: number; aplicaciones: number }[];
  epnVsExternal: { name: string; value: number; fill: string }[];
  topTags: {
    tag: string;
    ofertas: number;
    interesados: number;
    demandaTotal: number;
  }[];
  kpis: {
    totalJobs: number;
    totalApplications: number;
    epnStudentsCount: number;
    externalCount: number;
    selectedCount: number;
  };
}
