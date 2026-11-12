import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { JobApplication, ApplicationStatus } from "@/types/policonnect";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    let sql = `
      SELECT
        a.id,
        a.job_id,
        a.user_id,
        a.status,
        a.match_score,
        a.applied_at,
        a.updated_at,
        j.title as job_title,
        j.company,
        j.location,
        j.modality,
        u.name as candidate_name,
        u.email as candidate_email,
        u.role as candidate_role,
        u.career as candidate_career,
        u.institution as candidate_institution,
        u.headline as candidate_headline,
        u.education_level as candidate_education,
        u.skills_json as candidate_skills_json,
        u.cv_filename as candidate_cv,
        u.avatar_url as candidate_avatar
      FROM Applications a
      INNER JOIN Jobs j ON j.id = a.job_id
      INNER JOIN Users u ON u.id = a.user_id
      WHERE 1 = 1
    `;

    const params: (number | string)[] = [];
    if (userId) {
      sql += " AND a.user_id = ?";
      params.push(Number(userId));
    }
    if (jobId && jobId !== "ALL") {
      sql += " AND a.job_id = ?";
      params.push(Number(jobId));
    }

    sql += " ORDER BY a.updated_at DESC, a.id DESC";

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];

    const getJobTagsStmt = db.prepare(`
      SELECT t.name FROM Tags t
      INNER JOIN JobTags jt ON jt.tag_id = t.id
      WHERE jt.job_id = ?
    `);

    const getUserTagsStmt = db.prepare(`
      SELECT t.name FROM Tags t
      INNER JOIN UserTags ut ON ut.tag_id = t.id
      WHERE ut.user_id = ?
    `);

    const applications: JobApplication[] = rows.map((r) => {
      const jTags = (
        getJobTagsStmt.all(Number(r.job_id)) as { name: string }[]
      ).map((t) => t.name);
      const uTags = (
        getUserTagsStmt.all(Number(r.user_id)) as { name: string }[]
      ).map((t) => t.name);

      let skills: string[] = [];
      try {
        skills = JSON.parse(String(r.candidate_skills_json || "[]"));
      } catch {
        skills = [];
      }

      return {
        id: Number(r.id),
        job_id: Number(r.job_id),
        user_id: Number(r.user_id),
        status: r.status as ApplicationStatus,
        match_score: Number(r.match_score || 80),
        applied_at: String(r.applied_at),
        updated_at: String(r.updated_at),
        job_title: String(r.job_title),
        company: String(r.company),
        location: String(r.location),
        modality: String(r.modality),
        job_tags: jTags,
        candidate_name: String(r.candidate_name),
        candidate_email: String(r.candidate_email),
        candidate_role: r.candidate_role as JobApplication["candidate_role"],
        candidate_career:
          (r.candidate_career as JobApplication["candidate_career"]) || null,
        candidate_institution: String(r.candidate_institution),
        candidate_headline: r.candidate_headline
          ? String(r.candidate_headline)
          : null,
        candidate_education: r.candidate_education
          ? String(r.candidate_education)
          : null,
        candidate_skills: skills,
        candidate_tags: uTags,
        candidate_cv: r.candidate_cv ? String(r.candidate_cv) : null,
        candidate_avatar: r.candidate_avatar
          ? String(r.candidate_avatar)
          : null,
      };
    });

    return NextResponse.json({ applications });
  } catch (err) {
    console.error("Error GET /api/applications:", err);
    return NextResponse.json(
      { error: "Error al obtener postulaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { jobId, userId, matchScore } = await request.json();

    if (!jobId || !userId) {
      return NextResponse.json(
        { error: "jobId y userId son requeridos." },
        { status: 400 }
      );
    }

    const existing = db
      .prepare("SELECT id FROM Applications WHERE job_id = ? AND user_id = ?")
      .get(Number(jobId), Number(userId)) as { id: number } | undefined;

    if (existing) {
      return NextResponse.json(
        { error: "Ya te has postulado a esta oferta laboral." },
        { status: 409 }
      );
    }

    const jobInfo = db
      .prepare("SELECT title, company FROM Jobs WHERE id = ?")
      .get(Number(jobId)) as { title: string; company: string } | undefined;

    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    db.exec("BEGIN TRANSACTION;");
    try {
      const res = db
        .prepare(
          `INSERT INTO Applications (job_id, user_id, status, match_score, applied_at, updated_at)
           VALUES (?, ?, 'En revisión', ?, ?, ?)`
        )
        .run(
          Number(jobId),
          Number(userId),
          Number(matchScore || 85),
          now,
          now
        );

      const appId = Number(res.lastInsertRowid);

      if (jobInfo) {
        db.prepare(
          `INSERT INTO Notifications (user_id, application_id, title, message, status_badge, is_read, created_at)
           VALUES (?, ?, ?, ?, 'En revisión', 0, ?)`
        ).run(
          Number(userId),
          appId,
          `Postulación enviada: ${jobInfo.company}`,
          `Tu postulación rápida al cargo "${jobInfo.title}" en ${jobInfo.company} ha sido registrada con estado "En revisión".`,
          now
        );
      }

      db.exec("COMMIT;");
      return NextResponse.json({
        success: true,
        applicationId: appId,
        message: "Postulación rápida enviada con éxito.",
      });
    } catch (inner) {
      db.exec("ROLLBACK;");
      throw inner;
    }
  } catch (err) {
    console.error("Error POST /api/applications:", err);
    return NextResponse.json(
      { error: "No se pudo procesar la postulación." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getDb();
    const { applicationId, status } = await request.json();

    const validStatuses: ApplicationStatus[] = [
      "En revisión",
      "Entrevistado",
      "Seleccionado",
      "Rechazado",
    ];

    if (!applicationId || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "ID de postulación o estado inválido." },
        { status: 400 }
      );
    }

    const appRow = db
      .prepare(
        `SELECT a.id, a.user_id, a.status as old_status, j.title, j.company, u.name as candidate_name
         FROM Applications a
         INNER JOIN Jobs j ON j.id = a.job_id
         INNER JOIN Users u ON u.id = a.user_id
         WHERE a.id = ?`
      )
      .get(Number(applicationId)) as
      | {
          id: number;
          user_id: number;
          old_status: string;
          title: string;
          company: string;
          candidate_name: string;
        }
      | undefined;

    if (!appRow) {
      return NextResponse.json(
        { error: "Postulación no encontrada." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    db.exec("BEGIN TRANSACTION;");
    try {
      db.prepare(
        "UPDATE Applications SET status = ?, updated_at = ? WHERE id = ?"
      ).run(status, now, Number(applicationId));

      let notifMessage = `El Administrador actualizó el estado de tu postulación para "${appRow.title}" en ${appRow.company} a: ${status}.`;
      if (status === "Seleccionado") {
        notifMessage = `¡Felicitaciones! Has sido SELECCIONADO para la vacante "${appRow.title}" en ${appRow.company}. Revisa tu correo institucional para la carta de oferta.`;
      } else if (status === "Entrevistado") {
        notifMessage = `Tu proceso para "${appRow.title}" en ${appRow.company} avanzó a la etapa "${status}".`;
      }

      db.prepare(
        `INSERT INTO Notifications (user_id, application_id, title, message, status_badge, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`
      ).run(
        appRow.user_id,
        appRow.id,
        `Actualización de Estado: ${appRow.company}`,
        notifMessage,
        status,
        now
      );

      db.exec("COMMIT;");
      return NextResponse.json({
        success: true,
        candidateName: appRow.candidate_name,
        newStatus: status,
        message: `Estado actualizado a "${status}" y notificación enviada a ${appRow.candidate_name}.`,
      });
    } catch (inner) {
      db.exec("ROLLBACK;");
      throw inner;
    }
  } catch (err) {
    console.error("Error PATCH /api/applications:", err);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la postulación." },
      { status: 500 }
    );
  }
}
