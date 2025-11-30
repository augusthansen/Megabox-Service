import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/prisma";

/**
 * File Upload API Route
 * 
 * Handles uploading photos and videos for tickets
 * Files are stored in the public/uploads directory
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const ticketId = formData.get("ticketId") as string;
    const uploadedById = formData.get("uploadedById") as string;
    const files = formData.getAll("files") as File[];

    if (!ticketId || !uploadedById || files.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: ticketId, uploadedById, or files" },
        { status: 400 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "tickets", ticketId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles = [];

    // Process each file
    for (const file of files) {
      // Validate file size
      const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for videos, 5MB for images
      if (file.size > maxSize) {
        continue; // Skip oversized files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop();
      const fileName = `${timestamp}-${randomStr}.${extension}`;
      const filePath = join(uploadsDir, fileName);

      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create file URL (relative to public directory)
      const fileUrl = `/uploads/tickets/${ticketId}/${fileName}`;

      // Save attachment record to database
      const attachment = await prisma.attachment.create({
        data: {
          ticketId: ticketId,
          fileName: file.name,
          fileUrl: fileUrl,
          fileType: file.type,
          fileSize: file.size,
          uploadedById: uploadedById,
        },
      });

      uploadedFiles.push(attachment);
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles.length,
      attachments: uploadedFiles,
    });
  } catch (error: any) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files", details: error.message },
      { status: 500 }
    );
  }
}

