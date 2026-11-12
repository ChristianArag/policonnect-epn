-- =============================================================================
-- PoliConnect EPN - Esquema de Base de Datos SQLite
-- Escuela Politécnica Nacional - Facultad de Ingeniería de Sistemas (FIS)
-- =============================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla de Usuarios (Administrador, Estudiante EPN - FIS, Externo)
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT '123456',
  role TEXT CHECK(role IN ('ADMIN', 'EPN_STUDENT', 'EXTERNAL')) NOT NULL,
  career TEXT CHECK(career IN ('Software', 'Sistemas de Información', 'Computación', 'Ciencias de Datos') OR career IS NULL),
  institution TEXT NOT NULL DEFAULT 'Escuela Politécnica Nacional',
  headline TEXT,
  experience_summary TEXT,
  education_level TEXT,
  skills_json TEXT DEFAULT '[]',
  avatar_url TEXT,
  cv_filename TEXT,
  cv_updated_at DATETIME,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Tags (Intereses profesionales, áreas técnicas y modalidades)
CREATE TABLE IF NOT EXISTS Tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Área Técnica'
);

-- 3. Relación Muchos-a-Muchos: Usuarios <-> Tags (Preferencias e Intereses)
CREATE TABLE IF NOT EXISTS UserTags (
  user_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, tag_id),
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
);

-- 4. Tabla de Ofertas Laborales y Pasantías (Jobs)
CREATE TABLE IF NOT EXISTS Jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Quito, Ecuador (Híbrido)',
  modality TEXT NOT NULL DEFAULT 'Tiempo Completo',
  vacancies INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  salary_range TEXT DEFAULT 'Competitivo / Convenio EPN',
  created_by INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
);

-- 5. Relación Muchos-a-Muchos: Ofertas <-> Tags
CREATE TABLE IF NOT EXISTS JobTags (
  job_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (job_id, tag_id),
  FOREIGN KEY (job_id) REFERENCES Jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
);

-- 6. Tabla de Postulaciones y Seguimiento (Applications)
CREATE TABLE IF NOT EXISTS Applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('En revisión', 'Entrevistado', 'Seleccionado', 'Rechazado')) NOT NULL DEFAULT 'En revisión',
  match_score INTEGER NOT NULL DEFAULT 80,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, user_id),
  FOREIGN KEY (job_id) REFERENCES Jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 7. Tabla de Notificaciones para Postulantes (Notifications)
CREATE TABLE IF NOT EXISTS Notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  application_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status_badge TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES Applications(id) ON DELETE SET NULL
);

-- Índices para optimización de consultas de Match y Analítica
CREATE INDEX IF NOT EXISTS idx_users_role_career ON Users(role, career);
CREATE INDEX IF NOT EXISTS idx_applications_job ON Applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON Applications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON Notifications(user_id, is_read);
