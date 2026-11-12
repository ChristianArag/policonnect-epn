import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const DB_PATH = path.join(process.cwd(), "policonnect.sqlite");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

declare global {
  // eslint-disable-next-line no-var
  var __policonnect_db: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (!global.__policonnect_db) {
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    initSchemaAndSeed(db);
    global.__policonnect_db = db;
  } else {
    ensureMigrations(global.__policonnect_db);
  }
  return global.__policonnect_db;
}

function ensureMigrations(db: DatabaseSync) {
  try {
    const columns = db.prepare("PRAGMA table_info(Users)").all() as {
      name: string;
    }[];
    const hasPassword = columns.some((c) => c.name === "password");
    if (!hasPassword) {
      db.exec(
        "ALTER TABLE Users ADD COLUMN password TEXT NOT NULL DEFAULT '123456';"
      );
    }
    const hasAvatar = columns.some((c) => c.name === "avatar_url");
    if (!hasAvatar) {
      db.exec("ALTER TABLE Users ADD COLUMN avatar_url TEXT;");
    }
    db.prepare(
      "UPDATE Users SET name = 'Administrador', email = 'admin@epn.edu.ec', headline = 'Administrador General — Bolsa de Empleo FIS EPN' WHERE role = 'ADMIN'"
    ).run();
  } catch (e) {
    console.warn("Aviso en migración automática SQLite:", e);
  }
}

function initSchemaAndSeed(db: DatabaseSync) {
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(schemaSql);
  }

  ensureMigrations(db);

  const countRow = db.prepare("SELECT COUNT(*) as total FROM Users").get() as {
    total: number;
  };
  if (countRow && countRow.total > 0) {
    return;
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    const tags: [string, string][] = [
      ["Backend", "Área Técnica"],
      ["Frontend", "Área Técnica"],
      ["Full Stack", "Área Técnica"],
      ["Datos", "Área Técnica"],
      ["Machine Learning", "Área Técnica"],
      ["Pasantía", "Modalidad"],
      ["Cloud & DevOps", "Infraestructura"],
      ["Ciberseguridad", "Infraestructura"],
      ["Arquitectura de Software", "Ingeniería"],
      ["BI & Analytics", "Datos y Negocio"],
      ["Python", "Lenguaje"],
      ["TypeScript", "Lenguaje"],
    ];

    const insertTag = db.prepare(
      "INSERT INTO Tags (name, category) VALUES (?, ?)"
    );
    const tagMap = new Map<string, number>();

    for (const [name, category] of tags) {
      const res = insertTag.run(name, category);
      tagMap.set(name, Number(res.lastInsertRowid));
    }

    const insertUser = db.prepare(`
      INSERT INTO Users (
        name, email, password, role, career, institution, headline,
        experience_summary, education_level, skills_json,
        cv_filename, cv_updated_at, onboarding_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      "Administrador",
      "admin@epn.edu.ec",
      "123456",
      "ADMIN",
      null,
      "Escuela Politécnica Nacional - Decanato FIS",
      "Administrador General — Bolsa de Empleo FIS EPN",
      "Gestión institucional de inserción laboral, prácticas preprofesionales y convenios corporativos en la Escuela Politécnica Nacional.",
      "Personal Universitario EPN",
      JSON.stringify(["Gestión Académica", "Vinculación", "Talento TI"]),
      null,
      null,
      1
    );

    insertUser.run(
      "Mateo Andrade Villacís",
      "mateo.andrade@epn.edu.ec",
      "123456",
      "EPN_STUDENT",
      "Software",
      "Escuela Politécnica Nacional",
      "Estudiante de Ing. de Software (8vo Semestre) | Backend & Arquitectura Cloud",
      "Desarrollador Backend Jr. en proyectos de investigación del Laboratorio de Sistemas Distribuidos EPN (1 año). Implementación de APIs REST con Node.js, TypeScript, PostgreSQL y Docker.",
      "Ingeniería de Software (8vo Semestre - EPN)",
      JSON.stringify([
        "Node.js",
        "TypeScript",
        "React",
        "Next.js",
        "Docker",
        "SQL",
        "Arquitectura Limpia",
      ]),
      "CV_Mateo_Andrade_EPN_2026.pdf",
      "2026-10-08 10:30:00",
      1
    );

    insertUser.run(
      "Valeria Proaño Cevallos",
      "valeria.proano@epn.edu.ec",
      "123456",
      "EPN_STUDENT",
      "Ciencias de Datos",
      "Escuela Politécnica Nacional",
      "Estudiante de Ciencias de Datos (7mo Semestre) | Machine Learning & NLP",
      "Ayudante de cátedra de Estadística Computacional y participante en proyectos de IA Generativa en la FIS-EPN.",
      "Ingeniería en Ciencias de Datos (7mo Semestre - EPN)",
      JSON.stringify(["Python", "PyTorch", "SQL", "Pandas", "Power BI"]),
      null,
      null,
      0
    );

    insertUser.run(
      "Sebastián Almeida",
      "sebastian.almeida@epn.edu.ec",
      "123456",
      "EPN_STUDENT",
      "Computación",
      "Escuela Politécnica Nacional",
      "Estudiante de Ciencias de la Computación (9no Semestre) | Cloud & Ciberseguridad",
      "Investigador Junior en CSIRT-EPN (Seguridad Informática y Redes). Automatización de despliegues en AWS y Kubernetes.",
      "Ingeniería en Ciencias de la Computación (9no Semestre - EPN)",
      JSON.stringify(["Linux", "AWS", "Ciberseguridad", "Go", "Python", "Docker"]),
      "CV_Sebastian_Almeida_FIS.pdf",
      "2026-10-25 14:15:00",
      1
    );

    insertUser.run(
      "Camila Espinoza",
      "camila.espinoza@epn.edu.ec",
      "123456",
      "EPN_STUDENT",
      "Sistemas de Información",
      "Escuela Politécnica Nacional",
      "Egresada de Sistemas de Información | Business Intelligence & Gobierno de Datos",
      "Pasante de Analítica Financiera y ERP (6 meses). Diseño de tableros ejecutivos y pipelines ETL corporativos.",
      "Ingeniería en Sistemas de Información (Egresada - EPN)",
      JSON.stringify(["Power BI", "SQL Server", "SAP", "Python", "Modelado BPMN"]),
      "CV_Camila_Espinoza_EPN.pdf",
      "2026-11-01 09:00:00",
      1
    );

    insertUser.run(
      "Diego Paredes Ordóñez",
      "diego.paredes@usfq.edu.ec",
      "123456",
      "EXTERNAL",
      null,
      "Universidad San Francisco de Quito (Graduado)",
      "Full Stack Developer | React, Node.js & Cloud Native",
      "2 años de experiencia desarrollando plataformas fintech y comercio electrónico en startups regionales.",
      "Ingeniero en Ciencias de la Computación (Graduado Externo)",
      JSON.stringify(["React", "TypeScript", "Node.js", "GraphQL", "AWS"]),
      "CV_Diego_Paredes_External.pdf",
      "2026-10-29 16:40:00",
      1
    );

    insertUser.run(
      "Gabriela Zurita",
      "gabriela.zurita@puce.edu.ec",
      "123456",
      "EXTERNAL",
      null,
      "Pontificia Universidad Católica del Ecuador",
      "Analista de Datos & Especialista BI",
      "Experiencia de 1.5 años en consultoría de datos, automatización de reportes y modelos predictivos de retención.",
      "Ingeniera en Sistemas y Computación (Externa)",
      JSON.stringify(["SQL", "Tableau", "Python", "R", "BigQuery"]),
      "CV_Gabriela_Zurita.pdf",
      "2026-11-02 11:20:00",
      1
    );

    insertUser.run(
      "Andrés Benalcázar",
      "andres.benalcazar@epn.edu.ec",
      "123456",
      "EPN_STUDENT",
      "Software",
      "Escuela Politécnica Nacional",
      "Estudiante de Ing. de Software (6to Semestre) | Frontend & Mobile UI",
      "Desarrollador de aplicaciones web y móviles universitarias con React, Next.js y TailwindCSS.",
      "Ingeniería de Software (6to Semestre - EPN)",
      JSON.stringify(["React", "Next.js", "TailwindCSS", "TypeScript", "Figma"]),
      "CV_Andres_Benalcazar_EPN.pdf",
      "2026-11-03 18:10:00",
      1
    );

    insertUser.run(
      "Daniela Hidalgo",
      "daniela.hidalgo@epn.edu.ec",
      "123456",
      "EPN_STUDENT",
      "Ciencias de Datos",
      "Escuela Politécnica Nacional",
      "Estudiante de Ciencias de Datos (9no Semestre) | Data Engineering & MLOps",
      "Tesista en modelos de predicción hidrológica con Deep Learning en convenio EPN - INAMHI.",
      "Ingeniería en Ciencias de Datos (9no Semestre - EPN)",
      JSON.stringify(["Python", "Spark", "TensorFlow", "SQL", "Airflow"]),
      "CV_Daniela_Hidalgo_EPN.pdf",
      "2026-11-05 12:00:00",
      1
    );

    const insertUserTag = db.prepare(
      "INSERT OR IGNORE INTO UserTags (user_id, tag_id) VALUES (?, ?)"
    );
    const assignUserTags = (userId: number, names: string[]) => {
      for (const name of names) {
        const tId = tagMap.get(name);
        if (tId) insertUserTag.run(userId, tId);
      }
    };

    assignUserTags(2, [
      "Backend",
      "Full Stack",
      "TypeScript",
      "Arquitectura de Software",
      "Cloud & DevOps",
    ]);
    assignUserTags(3, ["Datos", "Machine Learning", "Python", "Pasantía"]);
    assignUserTags(4, ["Ciberseguridad", "Cloud & DevOps", "Backend", "Python"]);
    assignUserTags(5, ["BI & Analytics", "Datos", "Pasantía"]);
    assignUserTags(6, ["Full Stack", "Frontend", "Backend", "TypeScript"]);
    assignUserTags(7, ["Datos", "BI & Analytics", "Python"]);
    assignUserTags(8, ["Frontend", "Full Stack", "TypeScript", "Pasantía"]);
    assignUserTags(9, ["Datos", "Machine Learning", "Python", "Cloud & DevOps"]);

    const insertJob = db.prepare(`
      INSERT INTO Jobs (
        title, company, location, modality, vacancies,
        description, salary_range, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertJobTag = db.prepare(
      "INSERT OR IGNORE INTO JobTags (job_id, tag_id) VALUES (?, ?)"
    );
    const assignJobTags = (jobId: number, names: string[]) => {
      for (const name of names) {
        const tId = tagMap.get(name);
        if (tId) insertJobTag.run(jobId, tId);
      }
    };

    const j1 = Number(
      insertJob.run(
        "Ingeniero de Software Backend Jr. (Microservicios & Cloud)",
        "Banco Pichincha — Innovación Digital",
        "Quito, Ecuador (Híbrido)",
        "Tiempo Completo",
        3,
        "Buscamos talento politécnico y graduados apasionados por el diseño de servicios financieros de alta concurrencia. Participarás en el desarrollo de APIs transaccionales con Node.js, TypeScript, arquitectura hexagonal y despliegue automatizado en nube.",
        "$1,100 - $1,400 / mes",
        1
      ).lastInsertRowid
    );
    assignJobTags(j1, [
      "Backend",
      "TypeScript",
      "Arquitectura de Software",
      "Cloud & DevOps",
    ]);

    const j2 = Number(
      insertJob.run(
        "Pasantía en Ciencia de Datos e IA Generativa (Convenio FIS-EPN)",
        "Kruger Corp — AI Labs",
        "Quito, Ecuador (Híbrido)",
        "Pasantía (6 horas)",
        2,
        "Programa exclusivo de vinculación para estudiantes de últimos semestres. Trabajarás junto al equipo de IA aplicando modelos LLM, RAG sobre documentos corporativos y pipelines de datos en Python.",
        "$480 estipendio + Certificación Cloud",
        1
      ).lastInsertRowid
    );
    assignJobTags(j2, ["Datos", "Machine Learning", "Python", "Pasantía"]);

    const j3 = Number(
      insertJob.run(
        "Desarrollador Full Stack (React / Next.js / Node)",
        "Kushki Pagos Regional",
        "Quito / Remoto Ecuador",
        "Tiempo Completo",
        2,
        "Únete a la fintech líder de infraestructura de pagos en Latinoamérica. Construirás interfaces modernas de conciliación bancaria en Next.js y servicios de orquestación en TypeScript con altos estándares de calidad.",
        "$1,350 - $1,700 / mes",
        1
      ).lastInsertRowid
    );
    assignJobTags(j3, ["Full Stack", "Frontend", "Backend", "TypeScript"]);

    const j4 = Number(
      insertJob.run(
        "Pasante de Sistemas de Información & Business Intelligence",
        "Corporación Favorita — Analítica Corporativa",
        "Quito, Ecuador (Presencial / Híbrido)",
        "Pasantía",
        4,
        "Convocatoria para estudiantes de Sistemas de Información, Computación o Ciencias de Datos. Apoyo en modelado dimensional de almacenes de datos, automatización de reportes ejecutivos y gobierno de datos.",
        "$460 estipendio + Alimentación",
        1
      ).lastInsertRowid
    );
    assignJobTags(j4, ["BI & Analytics", "Datos", "Pasantía"]);

    const j5 = Number(
      insertJob.run(
        "Especialista Junior en DevSecOps e Infraestructura Cloud",
        "Thoughtworks Ecuador",
        "Remoto (Ecuador)",
        "Tiempo Completo",
        2,
        "Buscamos ingenieros recién graduados o de último semestre con bases sólidas en sistemas operativos, redes, contenedores, automatización CI/CD y seguridad en la nube.",
        "$1,300 - $1,600 / mes",
        1
      ).lastInsertRowid
    );
    assignJobTags(j5, ["Ciberseguridad", "Cloud & DevOps", "Backend", "Python"]);

    const insertApp = db.prepare(`
      INSERT INTO Applications (job_id, user_id, status, match_score, applied_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const appMateo1 = Number(
      insertApp.run(
        j1,
        2,
        "Entrevistado",
        96,
        "2026-11-04 09:15:00",
        "2026-11-09 15:20:00"
      ).lastInsertRowid
    );
    const appMateo2 = Number(
      insertApp.run(
        j5,
        2,
        "En revisión",
        84,
        "2026-11-07 11:40:00",
        "2026-11-07 11:40:00"
      ).lastInsertRowid
    );

    insertApp.run(j1, 4, "En revisión", 88, "2026-11-05 10:00:00", "2026-11-05 10:00:00");
    insertApp.run(j5, 4, "Seleccionado", 98, "2026-11-02 14:30:00", "2026-11-09 17:00:00");

    insertApp.run(j4, 5, "Seleccionado", 97, "2026-11-03 08:45:00", "2026-11-08 16:10:00");
    insertApp.run(j2, 5, "Entrevistado", 85, "2026-11-06 13:20:00", "2026-11-09 10:00:00");

    insertApp.run(j1, 6, "Rechazado", 78, "2026-11-04 16:00:00", "2026-11-08 12:00:00");
    insertApp.run(j3, 6, "Entrevistado", 94, "2026-11-05 12:10:00", "2026-11-09 11:30:00");

    insertApp.run(j2, 7, "En revisión", 86, "2026-11-07 09:50:00", "2026-11-07 09:50:00");
    insertApp.run(j4, 7, "Entrevistado", 91, "2026-11-04 15:00:00", "2026-11-08 14:00:00");

    insertApp.run(j3, 8, "En revisión", 92, "2026-11-08 10:15:00", "2026-11-08 10:15:00");

    insertApp.run(j2, 9, "Seleccionado", 99, "2026-11-02 09:00:00", "2026-11-09 18:00:00");
    insertApp.run(j4, 9, "En revisión", 89, "2026-11-06 11:00:00", "2026-11-06 11:00:00");

    const insertNotif = db.prepare(`
      INSERT INTO Notifications (user_id, application_id, title, message, status_badge, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotif.run(
      2,
      appMateo1,
      "Avance en proceso: Banco Pichincha",
      "El Administrador actualizó el estado de tu postulación para 'Ingeniero de Software Backend Jr.' a: Entrevistado.",
      "Entrevistado",
      0,
      "2026-11-09 15:20:00"
    );

    insertNotif.run(
      2,
      appMateo2,
      "Postulación recibida: Thoughtworks Ecuador",
      "Tu perfil politécnico fue enviado exitosamente a la vacante 'Especialista Junior en DevSecOps e Infraestructura Cloud'. Estado actual: En revisión.",
      "En revisión",
      1,
      "2026-11-07 11:40:00"
    );

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    console.error("Error seeding PoliConnect SQLite database:", err);
  }
}
