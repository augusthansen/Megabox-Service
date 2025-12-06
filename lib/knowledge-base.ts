import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Lazy-initialized clients to ensure env vars are loaded
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    // Try multiple ways to get the key
    let apiKey = process.env.ANTHROPIC_API_KEY;

    // If empty string, try reading from file directly (workaround for Next.js env issue
    // where Anthropic SDK may override ANTHROPIC_API_KEY with an empty value)
    if (!apiKey || apiKey === "") {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const match = envContent.match(/^ANTHROPIC_API_KEY=["']?([^"'\n]+)["']?$/m);
          if (match) {
            apiKey = match[1];
          }
        }
      } catch (e) {
        // Silent fail, will throw below if key not found
      }
    }

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set. Check .env.local file.");
    }
    anthropicClient = new Anthropic({
      apiKey,
    });
  }
  return anthropicClient;
}

// Configuration
const EMBEDDING_MODEL = "text-embedding-3-small";
const CLAUDE_MODEL = "claude-sonnet-4-20250514"; // Claude for chat responses
const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks for context continuity
const MAX_SEARCH_RESULTS = 5; // Number of chunks to retrieve for context

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getOpenAI().embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Split text into chunks with overlap
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const chunks: string[] = [];

  // Clean the text
  const cleanedText = text
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  let startIndex = 0;
  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;

    // Try to break at a sentence or word boundary
    if (endIndex < cleanedText.length) {
      // Look for sentence boundary (., !, ?)
      const sentenceEnd = cleanedText.lastIndexOf(".", endIndex);
      const questionEnd = cleanedText.lastIndexOf("?", endIndex);
      const exclamEnd = cleanedText.lastIndexOf("!", endIndex);
      const bestEnd = Math.max(sentenceEnd, questionEnd, exclamEnd);

      if (bestEnd > startIndex + chunkSize / 2) {
        endIndex = bestEnd + 1;
      } else {
        // Fall back to word boundary
        const spaceIndex = cleanedText.lastIndexOf(" ", endIndex);
        if (spaceIndex > startIndex + chunkSize / 2) {
          endIndex = spaceIndex;
        }
      }
    }

    chunks.push(cleanedText.slice(startIndex, endIndex).trim());
    startIndex = endIndex - overlap;

    // Prevent infinite loop
    if (startIndex >= cleanedText.length - overlap) {
      break;
    }
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Search for relevant document chunks using semantic search
 */
export async function searchDocuments(
  query: string,
  options: {
    limit?: number;
    documentType?: string;
    manufacturer?: string;
    machineModel?: string;
    documentIds?: string[];
  } = {}
): Promise<
  {
    chunk: any;
    document: any;
    similarity: number;
  }[]
> {
  const limit = options.limit || MAX_SEARCH_RESULTS;

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Build where clause for filtering
  const documentWhere: any = {
    isPublished: true,
    status: "completed",
  };

  if (options.documentType) {
    documentWhere.documentType = options.documentType;
  }
  if (options.manufacturer) {
    documentWhere.manufacturer = options.manufacturer;
  }
  if (options.machineModel) {
    documentWhere.OR = [
      { machineModel: options.machineModel },
      { machineModels: { has: options.machineModel } },
    ];
  }
  if (options.documentIds && options.documentIds.length > 0) {
    documentWhere.id = { in: options.documentIds };
  }

  // Get all chunks from matching documents
  // Note: Using NOT equals DbNull to filter out null embeddings for Json fields
  const chunks = await prisma.documentChunk.findMany({
    where: {
      document: documentWhere,
      NOT: {
        embedding: { equals: Prisma.DbNull },
      },
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          fileName: true,
          fileUrl: true,
          documentType: true,
          manufacturer: true,
          machineModel: true,
          pageCount: true,
        },
      },
    },
  });

  // Calculate similarity for each chunk
  const scoredChunks = chunks.map((chunk) => {
    const embedding = chunk.embedding as number[];
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    return {
      chunk,
      document: chunk.document,
      similarity,
    };
  });

  // Sort by similarity and return top results
  scoredChunks.sort((a, b) => b.similarity - a.similarity);
  return scoredChunks.slice(0, limit);
}

/**
 * Generate an AI response using RAG (Retrieval Augmented Generation)
 */
export async function generateRAGResponse(
  query: string,
  options: {
    sessionId?: string;
    documentType?: string;
    manufacturer?: string;
    machineModel?: string;
    conversationHistory?: { role: "user" | "assistant"; content: string }[];
  } = {}
): Promise<{
  response: string;
  citations: {
    documentId: string;
    documentTitle: string;
    chunkId: string;
    pageNumber: number | null;
    snippet: string;
    similarity: number;
  }[];
}> {
  // Search for relevant chunks
  const searchResults = await searchDocuments(query, {
    limit: MAX_SEARCH_RESULTS,
    documentType: options.documentType,
    manufacturer: options.manufacturer,
    machineModel: options.machineModel,
  });

  // Build context from search results
  const context = searchResults
    .map((result, index) => {
      const pageInfo = result.chunk.pageNumber
        ? ` (Page ${result.chunk.pageNumber})`
        : "";
      return `[Source ${index + 1}: "${result.document.title}"${pageInfo}]\n${result.chunk.content}`;
    })
    .join("\n\n---\n\n");

  // Build system prompt for Claude
  const systemPrompt = `You are a service technician assistant for Megabox Supply. Answer questions directly using the provided documentation.

RULES:
1. Give direct answers - no preamble like "Based on the documentation..." or "According to..."
2. No closing filler like "Let me know if you need more information" or "Feel free to ask..."
3. Use bullet points and numbered steps for procedures
4. Cite sources inline: (Document Name, Page X)
5. If the answer isn't in the context, just say "I don't have information on that in the available documentation."
6. Include safety warnings when relevant
7. Be concise - technicians need actionable information fast

CONTEXT FROM DOCUMENTATION:
${context || "No relevant documentation found for this query."}`;

  // Build messages for Claude
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history if provided
  if (options.conversationHistory) {
    for (const msg of options.conversationHistory.slice(-6)) {
      // Keep last 6 messages for context
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add the current query
  messages.push({ role: "user", content: query });

  // Generate response using Claude
  const completion = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  const response = completion.content[0].type === "text"
    ? completion.content[0].text
    : "I couldn't generate a response.";

  // Build citations
  const citations = searchResults.map((result) => ({
    documentId: result.document.id,
    documentTitle: result.document.title,
    chunkId: result.chunk.id,
    pageNumber: result.chunk.pageNumber,
    snippet: result.chunk.content.slice(0, 200) + "...",
    similarity: result.similarity,
  }));

  return { response, citations };
}

/**
 * Extract text from a PDF buffer
 * Note: This requires pdf-parse package
 */
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<{ text: string; numPages: number }> {
  // Dynamic import to avoid issues with server-side rendering
  const pdfParse = (await import("pdf-parse")).default;

  // Call pdf-parse without the pagerender option - that was suppressing text extraction
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    numPages: data.numpages,
  };
}

/**
 * Process a document: extract text, chunk it, and generate embeddings
 */
export async function processDocument(documentId: string): Promise<void> {
  // Update status to processing
  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { status: "processing" },
  });

  try {
    // Get the document
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Fetch the PDF file
    const response = await fetch(document.fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Extract text from PDF
    const { text, numPages } = await extractTextFromPDF(buffer);

    console.log(`Extracted ${text.length} characters from ${numPages} pages for document ${documentId}`);
    console.log(`First 500 chars: ${text.substring(0, 500)}`);

    // Split into chunks
    const chunks = splitTextIntoChunks(text);
    console.log(`Created ${chunks.length} chunks from document ${documentId}`);

    // Check for existing chunks (to support resume after failure)
    const existingChunks = await prisma.documentChunk.findMany({
      where: { documentId },
      select: { chunkIndex: true },
    });
    const existingChunkIndexes = new Set(existingChunks.map((c) => c.chunkIndex));

    // Update page count and total chunks (preserve existing processedChunks for resume)
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        pageCount: numPages,
        totalChunks: chunks.length,
        processedChunks: existingChunks.length,
      },
    });

    // If we have existing chunks with a different total, start fresh
    // Otherwise, resume from where we left off
    if (existingChunks.length > 0 && existingChunks.length < chunks.length) {
      console.log(`Resuming processing: ${existingChunks.length} chunks already exist, ${chunks.length - existingChunks.length} remaining`);
    } else if (existingChunks.length === chunks.length) {
      console.log(`All ${chunks.length} chunks already exist, marking as completed`);
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          status: "completed",
          processedAt: new Date(),
          processedChunks: chunks.length,
        },
      });
      return;
    } else if (existingChunks.length > chunks.length) {
      // Content changed, delete and start fresh
      console.log(`Content changed, deleting ${existingChunks.length} old chunks and reprocessing`);
      await prisma.documentChunk.deleteMany({
        where: { documentId },
      });
      existingChunkIndexes.clear();
    }

    // Create chunks with embeddings
    console.log(`Starting to process ${chunks.length} chunks for document ${documentId}`);

    // Helper function to retry database operations
    const retryOperation = async <T>(
      operation: () => Promise<T>,
      maxRetries: number = 3,
      delay: number = 2000
    ): Promise<T> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error: any) {
          if (attempt === maxRetries) throw error;
          console.log(`Retry attempt ${attempt}/${maxRetries} after error: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
      throw new Error("Max retries exceeded");
    };

    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];

      // Skip chunks that already exist (for resume functionality)
      if (existingChunkIndexes.has(i)) {
        continue;
      }

      try {
        // Generate embedding with retry
        const embedding = await retryOperation(() => generateEmbedding(chunkContent));

        // Estimate page number (rough approximation)
        const estimatedPage = Math.ceil(((i + 1) / chunks.length) * numPages);

        // Create chunk with retry
        await retryOperation(() =>
          prisma.documentChunk.create({
            data: {
              documentId,
              content: chunkContent,
              chunkIndex: i,
              pageNumber: estimatedPage,
              embedding: embedding,
              embeddingModel: EMBEDDING_MODEL,
            },
          })
        );

        // Update progress every 10 chunks
        if (i % 10 === 0 || i === chunks.length - 1) {
          await retryOperation(() =>
            prisma.knowledgeDocument.update({
              where: { id: documentId },
              data: { processedChunks: i + 1 },
            })
          );
        }

        // Log progress every 50 chunks
        if (i % 50 === 0) {
          console.log(`Processed chunk ${i + 1}/${chunks.length} for document ${documentId}`);
        }

        // Add delays to avoid rate limiting and connection issues
        // Small delay every 10 chunks
        if (i % 10 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Longer break every 50 chunks to let connection pool recover
        if (i % 50 === 0 && i > 0) {
          console.log(`Taking 3 second break at chunk ${i} to prevent connection timeout...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (chunkError: any) {
        console.error(`Error processing chunk ${i} for document ${documentId}:`, chunkError.message);
        throw chunkError; // Re-throw to mark document as failed
      }
    }

    // Update status to completed
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: "completed",
        processedAt: new Date(),
      },
    });

    console.log(`Successfully processed document ${documentId} with ${chunks.length} chunks`);
  } catch (error: any) {
    console.error(`Error processing document ${documentId}:`, error);

    // Update status to failed - retry with delays to handle connection issues
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await prisma.knowledgeDocument.update({
          where: { id: documentId },
          data: {
            status: "failed",
            processingError: error.message || "Unknown error",
          },
        });
        console.log(`Successfully marked document ${documentId} as failed`);
        break;
      } catch (updateError: any) {
        console.error(`Failed to update document status (attempt ${attempt}/${maxRetries}):`, updateError.message);
        if (attempt < maxRetries) {
          // Wait longer between retries for connection recovery
          await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
        }
      }
    }

    throw error;
  }
}

/**
 * Get document statistics
 */
export async function getKnowledgeBaseStats() {
  const [totalDocuments, processedDocuments, totalChunks, documentsByType] = await Promise.all([
    prisma.knowledgeDocument.count(),
    prisma.knowledgeDocument.count({ where: { status: "completed" } }),
    prisma.documentChunk.count(),
    prisma.knowledgeDocument.groupBy({
      by: ["documentType"],
      _count: { id: true },
    }),
  ]);

  return {
    totalDocuments,
    processedDocuments,
    totalChunks,
    documentsByType: documentsByType.reduce((acc, item) => {
      acc[item.documentType] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
  };
}
