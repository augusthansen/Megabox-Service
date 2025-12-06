import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/knowledge-base";

/**
 * Single Document API
 *
 * GET: Get document details
 * PATCH: Update document metadata
 * DELETE: Delete document
 */

// GET - Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.knowledgeDocument.findUnique({
      where: { id },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.knowledgeDocument.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PATCH - Update document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      documentType,
      manufacturer,
      machineModel,
      machineModels,
      category,
      tags,
      description,
      documentNumber,
      revision,
      documentDate,
      isPublished,
      reprocess, // Flag to trigger reprocessing
    } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (documentType !== undefined) updateData.documentType = documentType;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (machineModel !== undefined) updateData.machineModel = machineModel;
    if (machineModels !== undefined) updateData.machineModels = machineModels;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (description !== undefined) updateData.description = description;
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber;
    if (revision !== undefined) updateData.revision = revision;
    if (documentDate !== undefined) {
      updateData.documentDate = documentDate ? new Date(documentDate) : null;
    }
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const document = await prisma.knowledgeDocument.update({
      where: { id },
      data: updateData,
    });

    // Trigger reprocessing if requested
    if (reprocess) {
      processDocument(id).catch((error) => {
        console.error("Reprocessing error:", error);
      });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete document (chunks will be cascade deleted)
    await prisma.knowledgeDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
