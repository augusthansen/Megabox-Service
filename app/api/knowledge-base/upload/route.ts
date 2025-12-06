import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/knowledge-base";
import { createClient } from "@supabase/supabase-js";

/**
 * Knowledge Base Upload API
 *
 * POST: Upload a PDF document to the knowledge base
 */

// Initialize Supabase client for storage
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_MIME_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get file
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    // Get metadata from form
    const title = formData.get("title") as string || file.name.replace(".pdf", "");
    const documentType = formData.get("documentType") as string || "other";
    const manufacturer = formData.get("manufacturer") as string | null;
    const machineModel = formData.get("machineModel") as string | null;
    const machineModelsJson = formData.get("machineModels") as string | null;
    const category = formData.get("category") as string | null;
    const tagsJson = formData.get("tags") as string | null;
    const description = formData.get("description") as string | null;
    const documentNumber = formData.get("documentNumber") as string | null;
    const revision = formData.get("revision") as string | null;
    const documentDate = formData.get("documentDate") as string | null;
    const uploadedById = formData.get("uploadedById") as string;
    const uploadedByName = formData.get("uploadedByName") as string;

    if (!uploadedById || !uploadedByName) {
      return NextResponse.json(
        { error: "Uploader information is required" },
        { status: 400 }
      );
    }

    // Parse arrays from JSON
    const machineModels = machineModelsJson ? JSON.parse(machineModelsJson) : [];
    const tags = tagsJson ? JSON.parse(tagsJson) : [];

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `knowledge-base/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // Create document record
    const document = await prisma.knowledgeDocument.create({
      data: {
        title,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        documentType: documentType as any,
        manufacturer,
        machineModel,
        machineModels,
        category,
        tags,
        description,
        documentNumber,
        revision,
        documentDate: documentDate ? new Date(documentDate) : null,
        uploadedById,
        uploadedByName,
        status: "pending",
      },
    });

    // Start processing in background (don't await)
    processDocument(document.id).catch((error) => {
      console.error("Background processing error:", error);
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        status: document.status,
      },
      message: "Document uploaded successfully. Processing will begin shortly.",
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: `Failed to upload document: ${error.message}` },
      { status: 500 }
    );
  }
}
