import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { NotificationItem } from "@/types/policonnect";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ notifications: [] });
    }

    const rows = db
      .prepare(
        `SELECT * FROM Notifications
         WHERE user_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 25`
      )
      .all(Number(userId)) as Record<string, unknown>[];

    const notifications: NotificationItem[] = rows.map((r) => ({
      id: Number(r.id),
      user_id: Number(r.user_id),
      application_id: r.application_id ? Number(r.application_id) : null,
      title: String(r.title),
      message: String(r.message),
      status_badge: r.status_badge ? String(r.status_badge) : null,
      is_read: Boolean(r.is_read),
      created_at: String(r.created_at),
    }));

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("Error GET /api/notifications:", err);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getDb();
    const { userId, notificationId } = await request.json();

    if (notificationId) {
      db.prepare("UPDATE Notifications SET is_read = 1 WHERE id = ?").run(
        Number(notificationId)
      );
    } else if (userId) {
      db.prepare("UPDATE Notifications SET is_read = 1 WHERE user_id = ?").run(
        Number(userId)
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error PATCH /api/notifications:", err);
    return NextResponse.json(
      { error: "No se pudieron marcar las notificaciones como leídas" },
      { status: 500 }
    );
  }
}
