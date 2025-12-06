import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBaseStats } from "@/lib/knowledge-base";

/**
 * Knowledge Base Stats API
 *
 * GET: Get knowledge base statistics
 */

export async function GET(request: NextRequest) {
  try {
    const stats = await getKnowledgeBaseStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching knowledge base stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base stats" },
      { status: 500 }
    );
  }
}
