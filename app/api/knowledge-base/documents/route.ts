import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/knowledge-base";

/**
 * Knowledge Base Documents API
 *
 * GET: List all documents with filtering
 * POST: Upload a new document
 */

// GET - List documents
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get("documentType");
    const manufacturer = searchParams.get("manufacturer");
    const machineModel = searchParams.get("machineModel");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (documentType) {
      where.documentType = documentType;
    }
    if (manufacturer) {
      where.manufacturer = manufacturer;
    }
    if (machineModel) {
      where.OR = [
        { machineModel },
        { machineModels: { has: machineModel } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { fileName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { chunks: true },
          },
        },
      }),
      prisma.knowledgeDocument.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST - Create a new document record (file upload handled separately)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
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
      uploadedById,
      uploadedByName,
      autoProcess = true, // Whether to automatically start processing
    } = body;

    // Validate required fields
    if (!title || !fileName || !fileUrl || !uploadedById || !uploadedByName) {
      return NextResponse.json(
        { error: "Missing required fields: title, fileName, fileUrl, uploadedById, uploadedByName" },
        { status: 400 }
      );
    }

    // Create the document record
    const document = await prisma.knowledgeDocument.create({
      data: {
        title,
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || "application/pdf",
        documentType: documentType || "other",
        manufacturer,
        machineModel,
        machineModels: machineModels || [],
        category,
        tags: tags || [],
        description,
        documentNumber,
        revision,
        documentDate: documentDate ? new Date(documentDate) : null,
        uploadedById,
        uploadedByName,
        status: "pending",
      },
    });

    // Start processing in background if autoProcess is true
    if (autoProcess) {
      // Don't await - let it process in background
      processDocument(document.id).catch((error) => {
        console.error("Background document processing error:", error);
      });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
