import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { JobOffer, ApplicationStatus } from "@/types/policonnect";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const userId = userIdParam ? Number(userIdParam) : null;

    // Obtener los tags del usuario activo para calcular el porcentaje de Match
    let userTags: string[] = [];
    if (userId) {
      const uTagRows = db
        .prepare(
          `SELECT t.name FROM Tags t
           INNER JOIN UserTags ut ON ut.tag_id = t.id
           WHERE ut.user_id = ?`
        )
        .all(userId) as { name: string }[];
      userTags = uTagRows.map((r) => r.name);
    }

    const rawJobs = db
      .prepare(
        `SELECT j.*,
          (SELECT COUNT(*) FROM Applications a WHERE a.job_id = j.id) as applicant_count
         FROM Jobs j
         WHERE j.is_active = 1
         ORDER BY j.created_at DESC, j.id DESC`
      )
      .all() as Record<string, unknown>[];

    const getJobTagsStmt = db.prepare(`
      SELECT t.name
      FROM Tags t
      INNER JOIN JobTags jt ON jt.tag_id = t.id
      WHERE jt.job_id = ?
      ORDER BY t.name ASC
    `);

    const getUserAppStmt = db.prepare(`
      SELECT status FROM Applications WHERE job_id = ? AND user_id = ?
    `);

    const jobs: JobOffer[] = rawJobs.map((j) => {
      const jobId = Number(j.id);
      const tagRows = getJobTagsStmt.all(jobId) as { name: string }[];
      const jobTags = tagRows.map((t) => t.name);

      // Cálculo de Match con los tags del postulante
      const matchingTags = jobTags.filter((t) =>
        userTags.some((ut) => ut.toLowerCase() === t.toLowerCase())
      );

      let matchScore = 65;
      if (jobTags.length > 0 && userTags.length > 0) {
        const ratio = matchingTags.length / jobTags.length;
        matchScore = Math.min(99, Math.round(58 + ratio * 41));
      }

      let hasApplied = false;
      let myStatus: ApplicationStatus | null = null;
      if (userId) {
        const appRow = getUserAppStmt.get(jobId, userId) as
          | { status: ApplicationStatus }
          | undefined;
        if (appRow) {
          hasApplied = true;
          myStatus = appRow.status;
        }
      }

      return {
        id: jobId,
        title: String(j.title),
        company: String(j.company),
        location: String(j.location),
        modality: String(j.modality),
        vacancies: Number(j.vacancies),
        description: String(j.description),
        salary_range: String(j.salary_range || "A convenir"),
        created_by: j.created_by ? Number(j.created_by) : null,
        is_active: Boolean(j.is_active),
        created_at: String(j.created_at),
        tags: jobTags,
        applicant_count: Number(j.applicant_count || 0),
        match_score: matchScore,
        matching_tags: matchingTags,
        has_applied: hasApplied,
        my_application_status: myStatus,
      };
    });

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("Error GET /api/jobs:", err);
    return NextResponse.json(
      { error: "Error al consultar ofertas laborales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      title,
      company,
      location,
      modality,
      vacancies,
      description,
      salary_range,
      tags,
      created_by,
    } = body;

    if (!title || !company || !description) {
      return NextResponse.json(
        { error: "Título, empresa y descripción son obligatorios." },
        { status: 400 }
      );
    }

    db.exec("BEGIN TRANSACTION;");
    try {
      const insertJob = db.prepare(`
        INSERT INTO Jobs (title, company, location, modality, vacancies, description, salary_range, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const res = insertJob.run(
        String(title).trim(),
        String(company).trim(),
        String(location || "Quito, Ecuador (Híbrido)").trim(),
        String(modality || "Tiempo Completo").trim(),
        Number(vacancies || 1),
        String(description).trim(),
        String(salary_range || "Competitivo / Convenio EPN").trim(),
        created_by ? Number(created_by) : 1
      );

      const newJobId = Number(res.lastInsertRowid);

      if (Array.isArray(tags) && tags.length > 0) {
        const findTag = db.prepare("SELECT id FROM Tags WHERE name = ?");
        const insertTag = db.prepare(
          "INSERT INTO Tags (name, category) VALUES (?, 'Área Técnica')"
        );
        const linkJobTag = db.prepare(
          "INSERT OR IGNORE INTO JobTags (job_id, tag_id) VALUES (?, ?)"
        );

        for (const tName of tags) {
          const clean = String(tName).trim();
          if (!clean) continue;
          let existing = findTag.get(clean) as { id: number } | undefined;
          let tagId: number;
          if (!existing) {
            const tr = insertTag.run(clean);
            tagId = Number(tr.lastInsertRowid);
          } else {
            tagId = Number(existing.id);
          }
          linkJobTag.run(newJobId, tagId);
        }
      }

      db.exec("COMMIT;");
      return NextResponse.json({
        success: true,
        jobId: newJobId,
        message: "Oferta laboral publicada exitosamente.",
      });
    } catch (inner) {
      db.exec("ROLLBACK;");
      throw inner;
    }
  } catch (err) {
    console.error("Error POST /api/jobs:", err);
    return NextResponse.json(
      { error: "No se pudo registrar la oferta laboral." },
      { status: 500 }
    );
  }
}
