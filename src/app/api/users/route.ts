import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { UserProfile, TagItem } from "@/types/policonnect";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getDb();

    const rawUsers = db
      .prepare("SELECT * FROM Users ORDER BY id ASC")
      .all() as Record<string, unknown>[];

    const getUserTagsStmt = db.prepare(`
      SELECT t.name
      FROM Tags t
      INNER JOIN UserTags ut ON ut.tag_id = t.id
      WHERE ut.user_id = ?
      ORDER BY t.name ASC
    `);

    const users: UserProfile[] = rawUsers.map((u) => {
      const userId = Number(u.id);
      const tagRows = getUserTagsStmt.all(userId) as { name: string }[];
      let skills: string[] = [];
      try {
        skills = JSON.parse(String(u.skills_json || "[]"));
      } catch {
        skills = [];
      }

      return {
        id: userId,
        name: String(u.name),
        email: String(u.email),
        role: u.role as UserProfile["role"],
        career: (u.career as UserProfile["career"]) || null,
        institution: String(u.institution),
        headline: u.headline ? String(u.headline) : null,
        experience_summary: u.experience_summary
          ? String(u.experience_summary)
          : null,
        education_level: u.education_level ? String(u.education_level) : null,
        skills,
        tags: tagRows.map((t) => t.name),
        avatar_url: u.avatar_url ? String(u.avatar_url) : null,
        cv_filename: u.cv_filename ? String(u.cv_filename) : null,
        cv_updated_at: u.cv_updated_at ? String(u.cv_updated_at) : null,
        onboarding_completed: Boolean(u.onboarding_completed),
        created_at: String(u.created_at),
      };
    });

    const allTags = db
      .prepare("SELECT id, name, category FROM Tags ORDER BY id ASC")
      .all() as unknown as TagItem[];

    return NextResponse.json({ users, tags: allTags });
  } catch (err) {
    console.error("Error GET /api/users:", err);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      userId,
      name,
      role,
      career,
      institution,
      headline,
      experience_summary,
      education_level,
      skills,
      tags,
      avatar_url,
      cv_filename,
      onboarding_completed,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere userId para actualizar el perfil" },
        { status: 400 }
      );
    }

    db.exec("BEGIN TRANSACTION;");
    try {
      const now = new Date().toISOString().replace("T", " ").slice(0, 19);

      db.prepare(`
        UPDATE Users
        SET
          name = COALESCE(?, name),
          role = COALESCE(?, role),
          career = COALESCE(?, career),
          institution = COALESCE(?, institution),
          headline = COALESCE(?, headline),
          experience_summary = COALESCE(?, experience_summary),
          education_level = COALESCE(?, education_level),
          skills_json = COALESCE(?, skills_json),
          avatar_url = COALESCE(?, avatar_url),
          cv_filename = COALESCE(?, cv_filename),
          cv_updated_at = COALESCE(?, cv_updated_at),
          onboarding_completed = COALESCE(?, onboarding_completed)
        WHERE id = ?
      `).run(
        name ?? null,
        role ?? null,
        career !== undefined ? career : null,
        institution ?? null,
        headline ?? null,
        experience_summary ?? null,
        education_level ?? null,
        Array.isArray(skills) ? JSON.stringify(skills) : null,
        avatar_url !== undefined ? avatar_url : null,
        cv_filename ?? null,
        cv_filename ? now : null,
        onboarding_completed !== undefined
          ? onboarding_completed
            ? 1
            : 0
          : null,
        Number(userId)
      );

      if (Array.isArray(tags)) {
        db.prepare("DELETE FROM UserTags WHERE user_id = ?").run(Number(userId));
        const findTag = db.prepare("SELECT id FROM Tags WHERE name = ?");
        const insertTag = db.prepare(
          "INSERT INTO Tags (name, category) VALUES (?, 'Personalizado')"
        );
        const linkTag = db.prepare(
          "INSERT OR IGNORE INTO UserTags (user_id, tag_id) VALUES (?, ?)"
        );

        for (const tagName of tags) {
          const cleanName = String(tagName).trim();
          if (!cleanName) continue;
          const tagRow = findTag.get(cleanName) as { id: number } | undefined;
          let tagId: number;
          if (!tagRow) {
            const res = insertTag.run(cleanName);
            tagId = Number(res.lastInsertRowid);
          } else {
            tagId = Number(tagRow.id);
          }
          linkTag.run(Number(userId), tagId);
        }
      }

      db.exec("COMMIT;");
      return NextResponse.json({
        success: true,
        message: "Perfil actualizado correctamente en SQLite.",
      });
    } catch (innerErr) {
      db.exec("ROLLBACK;");
      throw innerErr;
    }
  } catch (err) {
    console.error("Error PUT /api/users:", err);
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil del usuario." },
      { status: 500 }
    );
  }
}
