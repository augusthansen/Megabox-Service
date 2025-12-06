import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/knowledge-base";

/**
 * Knowledge Base Search API
 *
 * POST: Search for relevant document chunks using semantic search
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, documentType, manufacturer, machineModel, limit } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const results = await searchDocuments(query.trim(), {
      limit: limit || 5,
      documentType,
      manufacturer,
      machineModel,
    });

    // Format results for frontend
    const formattedResults = results.map((result) => ({
      documentId: result.document.id,
      documentTitle: result.document.title,
      documentType: result.document.documentType,
      manufacturer: result.document.manufacturer,
      machineModel: result.document.machineModel,
      fileName: result.document.fileName,
      fileUrl: result.document.fileUrl,
      chunkId: result.chunk.id,
      content: result.chunk.content,
      pageNumber: result.chunk.pageNumber,
      similarity: result.similarity,
    }));

    return NextResponse.json({
      query,
      results: formattedResults,
      count: formattedResults.length,
    });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return NextResponse.json(
      { error: "Failed to search knowledge base" },
      { status: 500 }
    );
  }
}
