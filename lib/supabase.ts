import { createClient } from "@supabase/supabase-js";

// Supabase client for file storage
// Uses the same Supabase project as the database
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Server-side client with service role key (full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Storage bucket name for chat attachments
export const CHAT_ATTACHMENTS_BUCKET = "chat-attachments";

// Allowed file types for chat attachments
export const ALLOWED_FILE_TYPES = {
  // Images
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  // Videos
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  // Documents
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  // Archives
  "application/zip": ".zip",
};

// Maximum file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Check if file type is allowed
export function isAllowedFileType(mimeType: string): boolean {
  return mimeType in ALLOWED_FILE_TYPES;
}

// Get file extension from MIME type
export function getFileExtension(mimeType: string): string {
  return ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || "";
}

// Generate unique file path for storage
export function generateFilePath(
  ticketId: string,
  fileName: string,
  mimeType: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = getFileExtension(mimeType) || getExtensionFromFileName(fileName);
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);
  return `${ticketId}/${timestamp}-${randomId}-${sanitizedName}${extension ? "" : extension}`;
}

// Fallback to get extension from file name
function getExtensionFromFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > 0 ? fileName.substring(lastDot) : "";
}

// Get file category from MIME type
export function getFileCategory(
  mimeType: string
): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("msword")
  )
    return "document";
  return "other";
}
