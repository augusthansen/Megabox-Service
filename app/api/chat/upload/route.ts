import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  supabaseAdmin,
  CHAT_ATTACHMENTS_BUCKET,
  isAllowedFileType,
  MAX_FILE_SIZE,
  generateFilePath,
  getFileCategory,
} from "@/lib/supabase";

/**
 * Chat File Upload API Route
 *
 * POST: Upload a file to Supabase storage and create a chat message with the attachment
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const ticketId = formData.get("ticketId") as string | null;
    const senderId = formData.get("senderId") as string | null;
    const content = formData.get("content") as string | null; // Optional text message

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ticketId || !senderId) {
      return NextResponse.json(
        { error: "ticketId and senderId are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFileType(file.type)) {
      return NextResponse.json(
        {
          error: `File type "${file.type}" is not allowed. Allowed types: images, videos, PDFs, Word docs, and ZIP files.`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum limit of 50MB" },
        { status: 400 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Generate unique file path
    const filePath = generateFilePath(ticketId, file.name, file.type);

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Get public URL for the file
    const { data: urlData } = supabaseAdmin.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .getPublicUrl(uploadData.path);

    // Create chat message with attachment
    const message = await prisma.chatMessage.create({
      data: {
        ticketId,
        senderId,
        content: content || "", // Empty string if no text message
        attachmentUrl: urlData.publicUrl,
        attachmentType: file.type,
        attachmentName: file.name,
        attachmentSize: file.size,
      },
    });

    return NextResponse.json(
      {
        message,
        fileCategory: getFileCategory(file.type),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading chat attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
