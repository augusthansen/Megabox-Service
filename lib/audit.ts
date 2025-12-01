import { prisma } from "./prisma";

/**
 * Audit Logging Utility
 *
 * Tracks important data changes for compliance and debugging.
 */

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "login"
  | "logout"
  | "password_change"
  | "permission_change";

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  if (!prisma) {
    console.error("Audit log failed: Database not available");
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main operation
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Log a data creation event
 */
export async function logCreate(
  entityType: string,
  entityId: string,
  newValues: Record<string, unknown>,
  userId?: string,
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await createAuditLog({
    userId,
    action: "create",
    entityType,
    entityId,
    newValues: sanitizeValues(newValues),
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

/**
 * Log a data update event
 */
export async function logUpdate(
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  userId?: string,
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  // Only log fields that actually changed
  const changes = getChangedFields(oldValues, newValues);
  if (Object.keys(changes.old).length === 0) return;

  await createAuditLog({
    userId,
    action: "update",
    entityType,
    entityId,
    oldValues: sanitizeValues(changes.old),
    newValues: sanitizeValues(changes.new),
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

/**
 * Log a soft delete event
 */
export async function logDelete(
  entityType: string,
  entityId: string,
  userId?: string,
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await createAuditLog({
    userId,
    action: "delete",
    entityType,
    entityId,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

/**
 * Log a restore event (undoing soft delete)
 */
export async function logRestore(
  entityType: string,
  entityId: string,
  userId?: string,
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await createAuditLog({
    userId,
    action: "restore",
    entityType,
    entityId,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

/**
 * Log authentication events
 */
export async function logAuth(
  action: "login" | "logout" | "password_change",
  userId: string,
  request?: { ip?: string; userAgent?: string },
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: "User",
    entityId: userId,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
    metadata,
  });
}

/**
 * Get changed fields between old and new values
 */
function getChangedFields(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): { old: Record<string, unknown>; new: Record<string, unknown> } {
  const changedOld: Record<string, unknown> = {};
  const changedNew: Record<string, unknown> = {};

  for (const key of Object.keys(newValues)) {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedOld[key] = oldValues[key];
      changedNew[key] = newValues[key];
    }
  }

  return { old: changedOld, new: changedNew };
}

/**
 * Remove sensitive fields from values before logging
 */
function sanitizeValues(
  values: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = [
    "passwordHash",
    "password",
    "twoFactorSecret",
    "apiKey",
    "accessToken",
    "refreshToken",
  ];

  const sanitized = { ...values };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
}

/**
 * Query audit logs with filtering
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  if (!prisma) return [];

  const where: Record<string, unknown> = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.createdAt as Record<string, unknown>).lte = filters.endDate;
    }
  }

  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });
}
