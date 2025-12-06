import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRAGResponse } from "@/lib/knowledge-base";

/**
 * Knowledge Base Chat API
 *
 * POST: Send a message to the AI assistant and get a response with citations
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      sessionId,
      userId,
      userName,
      ticketId,
      documentType,
      documentTypes, // Array of document types for filtering
      manufacturer,
      machineModel,
    } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!userId || !userName) {
      return NextResponse.json(
        { error: "User information is required" },
        { status: 400 }
      );
    }

    // Get or create chat session
    let session;
    if (sessionId) {
      session = await prisma.knowledgeChatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20, // Get last 20 messages for context
          },
        },
      });
    }

    if (!session) {
      // Create new session
      session = await prisma.knowledgeChatSession.create({
        data: {
          userId,
          userName,
          ticketId,
          title: message.slice(0, 100), // Use first message as title
        },
        include: {
          messages: true,
        },
      });
    }

    // Build conversation history for context
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Generate AI response with RAG
    const { response, citations } = await generateRAGResponse(message.trim(), {
      sessionId: session.id,
      documentType,
      documentTypes, // Pass array of document types
      manufacturer,
      machineModel,
      conversationHistory,
    });

    // Save user message
    await prisma.knowledgeChatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: message.trim(),
      },
    });

    // Save assistant response with citations
    const assistantMessage = await prisma.knowledgeChatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: response,
        citations: citations,
      },
    });

    // Update session timestamp
    await prisma.knowledgeChatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      sessionId: session.id,
      messageId: assistantMessage.id,
      response,
      citations,
    });
  } catch (error) {
    console.error("Error in knowledge base chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

/**
 * GET: Get chat session history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    if (sessionId) {
      // Get specific session
      const session = await prisma.knowledgeChatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(session);
    }

    if (userId) {
      // Get user's recent sessions
      const sessions = await prisma.knowledgeChatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 20,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      return NextResponse.json(sessions);
    }

    return NextResponse.json(
      { error: "Session ID or User ID is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}
