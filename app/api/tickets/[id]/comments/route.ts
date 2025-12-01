import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/jwt";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(5000, "Comment too long"),
  isInternal: z.boolean().optional().default(false),
});

// POST - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    // Get current user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only super_admin and service_tech can create internal comments
    const canCreateInternal = session.role === "super_admin" || session.role === "service_tech";

    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content, isInternal } = validation.data;

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        ticketId: params.id,
        authorId: session.userId,
        authorName: session.name || session.email,
        content,
        isInternal: canCreateInternal ? isInternal : false, // Only allow internal if permitted
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform to match frontend expectations
    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      isInternal: comment.isInternal,
      user: {
        id: comment.author.id,
        name: comment.author.name,
        email: comment.author.email,
      },
      createdAt: comment.createdAt,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
