import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AdminStats, FISCareer } from "@/types/policonnect";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getDb();

    // 1. Postulantes y Postulaciones por carrera de la FIS (Software, Sistemas de Información, Computación, Ciencias de Datos)
    const careers: FISCareer[] = [
      "Software",
      "Sistemas de Información",
      "Computación",
      "Ciencias de Datos",
    ];

    const byCareer = careers.map((career) => {
      const studentsRow = db
        .prepare(
          "SELECT COUNT(*) as count FROM Users WHERE role = 'EPN_STUDENT' AND career = ?"
        )
        .get(career) as { count: number };

      const appsRow = db
        .prepare(
          `SELECT COUNT(*) as count
           FROM Applications a
           INNER JOIN Users u ON u.id = a.user_id
           WHERE u.role = 'EPN_STUDENT' AND u.career = ?`
        )
        .get(career) as { count: number };

      return {
        career,
        postulantes: Number(studentsRow?.count || 0),
        aplicaciones: Number(appsRow?.count || 0),
      };
    });

    // 2. Proporción Estudiantes EPN vs Externos
    const epnCountRow = db
      .prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'EPN_STUDENT'")
      .get() as { count: number };
    const extCountRow = db
      .prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'EXTERNAL'")
      .get() as { count: number };

    const epnStudentsCount = Number(epnCountRow?.count || 0);
    const externalCount = Number(extCountRow?.count || 0);

    const epnVsExternal = [
      {
        name: "Estudiantes EPN (FIS)",
        value: epnStudentsCount,
        fill: "#003876",
      },
      {
        name: "Postulantes Externos",
        value: externalCount,
        fill: "#94A3B8",
      },
    ];

    // 3. Tags más demandados (Ofertas que lo piden + Postulantes interesados)
    const tagStatsRows = db
      .prepare(
        `SELECT
           t.name as tag,
           (SELECT COUNT(*) FROM JobTags jt WHERE jt.tag_id = t.id) as ofertas,
           (SELECT COUNT(*) FROM UserTags ut WHERE ut.tag_id = t.id) as interesados
         FROM Tags t
         ORDER BY (ofertas + interesados) DESC, t.name ASC
         LIMIT 8`
      )
      .all() as { tag: string; ofertas: number; interesados: number }[];

    const topTags = tagStatsRows.map((r) => ({
      tag: String(r.tag),
      ofertas: Number(r.ofertas),
      interesados: Number(r.interesados),
      demandaTotal: Number(r.ofertas) + Number(r.interesados),
    }));

    // 4. KPIs Globales
    const totalJobsRow = db
      .prepare("SELECT COUNT(*) as count FROM Jobs WHERE is_active = 1")
      .get() as { count: number };
    const totalAppsRow = db
      .prepare("SELECT COUNT(*) as count FROM Applications")
      .get() as { count: number };
    const selectedAppsRow = db
      .prepare(
        "SELECT COUNT(*) as count FROM Applications WHERE status = 'Seleccionado'"
      )
      .get() as { count: number };

    const stats: AdminStats = {
      byCareer,
      epnVsExternal,
      topTags,
      kpis: {
        totalJobs: Number(totalJobsRow?.count || 0),
        totalApplications: Number(totalAppsRow?.count || 0),
        epnStudentsCount,
        externalCount,
        selectedCount: Number(selectedAppsRow?.count || 0),
      },
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("Error GET /api/stats:", err);
    return NextResponse.json(
      { error: "Error al calcular estadísticas del panel" },
      { status: 500 }
    );
  }
}
