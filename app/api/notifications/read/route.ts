import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Mark notifications as read
 * PUT: Mark specific notification(s) as read
 */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, markAll } = body;

    // Mark all notifications as read for a user
    if (markAll && userId) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    // Mark single notification as read
    if (notificationId) {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return NextResponse.json(notification);
    }

    return NextResponse.json(
      { error: "notificationId or (markAll + userId) is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
