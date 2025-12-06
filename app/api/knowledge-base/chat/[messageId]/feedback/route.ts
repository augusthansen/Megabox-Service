import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Chat Message Feedback API
 *
 * POST: Submit feedback on whether an AI response was helpful
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const { wasHelpful } = body;

    if (typeof wasHelpful !== "boolean") {
      return NextResponse.json(
        { error: "wasHelpful must be a boolean" },
        { status: 400 }
      );
    }

    // Update the message with feedback
    const message = await prisma.knowledgeChatMessage.update({
      where: { id: messageId },
      data: { wasHelpful },
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      wasHelpful: message.wasHelpful,
    });
  } catch (error) {
    console.error("Error updating message feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
