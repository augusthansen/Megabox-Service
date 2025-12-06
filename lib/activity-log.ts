import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

interface LogActivityParams {
  ticketId: string;
  actorId?: string;
  actorName: string;
  activityType: ActivityType;
  description: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity event for a ticket
 */
export async function logActivity({
  ticketId,
  actorId,
  actorName,
  activityType,
  description,
  oldValue,
  newValue,
  metadata,
}: LogActivityParams) {
  try {
    return await prisma.ticketActivityLog.create({
      data: {
        ticketId,
        actorId,
        actorName,
        activityType,
        description,
        oldValue,
        newValue,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - activity logging shouldn't break main operations
    return null;
  }
}

/**
 * Log ticket creation
 */
export async function logTicketCreated(
  ticketId: string,
  actorId: string,
  actorName: string,
  ticketNumber: string
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "created",
    description: `Ticket #${ticketNumber} was created`,
  });
}

/**
 * Log status change
 */
export async function logStatusChange(
  ticketId: string,
  actorId: string,
  actorName: string,
  oldStatus: string,
  newStatus: string
) {
  const statusLabels: Record<string, string> = {
    open: "Open",
    assigned: "Assigned",
    in_progress: "In Progress",
    on_hold: "On Hold",
    resolved: "Resolved",
    closed: "Closed",
  };

  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "status_change",
    description: `Status changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}`,
    oldValue: oldStatus,
    newValue: newStatus,
  });
}

/**
 * Log priority change
 */
export async function logPriorityChange(
  ticketId: string,
  actorId: string,
  actorName: string,
  oldPriority: string,
  newPriority: string
) {
  const priorityLabels: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  };

  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "priority_change",
    description: `Priority changed from ${priorityLabels[oldPriority] || oldPriority} to ${priorityLabels[newPriority] || newPriority}`,
    oldValue: oldPriority,
    newValue: newPriority,
  });
}

/**
 * Log assignment change
 */
export async function logAssignmentChange(
  ticketId: string,
  actorId: string,
  actorName: string,
  oldAssigneeName: string | null,
  newAssigneeName: string | null
) {
  let description: string;
  if (!oldAssigneeName && newAssigneeName) {
    description = `Assigned to ${newAssigneeName}`;
  } else if (oldAssigneeName && !newAssigneeName) {
    description = `Unassigned from ${oldAssigneeName}`;
  } else {
    description = `Reassigned from ${oldAssigneeName} to ${newAssigneeName}`;
  }

  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "assignment_change",
    description,
    oldValue: oldAssigneeName || undefined,
    newValue: newAssigneeName || undefined,
  });
}

/**
 * Log comment added
 */
export async function logCommentAdded(
  ticketId: string,
  actorId: string,
  actorName: string,
  isInternal: boolean
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "comment_added",
    description: isInternal ? "Added an internal note" : "Added a comment",
    metadata: { isInternal },
  });
}

/**
 * Log chat message
 */
export async function logChatMessage(
  ticketId: string,
  actorId: string,
  actorName: string,
  hasAttachment: boolean = false
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "chat_message",
    description: hasAttachment ? "Sent a message with attachment" : "Sent a message",
    metadata: { hasAttachment },
  });
}

/**
 * Log video call started
 */
export async function logVideoCallStarted(
  ticketId: string,
  actorId: string,
  actorName: string,
  sessionId: string
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "video_call_started",
    description: "Started a video call",
    metadata: { sessionId },
  });
}

/**
 * Log video call ended
 */
export async function logVideoCallEnded(
  ticketId: string,
  actorId: string,
  actorName: string,
  sessionId: string,
  durationMinutes?: number
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "video_call_ended",
    description: durationMinutes
      ? `Ended video call (${durationMinutes} minutes)`
      : "Ended video call",
    metadata: { sessionId, durationMinutes },
  });
}

/**
 * Log file uploaded
 */
export async function logFileUploaded(
  ticketId: string,
  actorId: string,
  actorName: string,
  fileName: string,
  fileType: string
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "file_uploaded",
    description: `Uploaded file: ${fileName}`,
    metadata: { fileName, fileType },
  });
}

/**
 * Log resolution added
 */
export async function logResolutionAdded(
  ticketId: string,
  actorId: string,
  actorName: string,
  resolutionCategory?: string
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "resolution_added",
    description: resolutionCategory
      ? `Marked as resolved (${resolutionCategory})`
      : "Marked as resolved with notes",
    newValue: resolutionCategory,
  });
}

/**
 * Log satisfaction rating
 */
export async function logSatisfactionRated(
  ticketId: string,
  actorId: string,
  actorName: string,
  rating: number
) {
  const starDisplay = "★".repeat(rating) + "☆".repeat(5 - rating);
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "satisfaction_rated",
    description: `Customer rated service: ${starDisplay} (${rating}/5)`,
    newValue: rating.toString(),
    metadata: { rating },
  });
}

/**
 * Log ticket edited
 */
export async function logTicketEdited(
  ticketId: string,
  actorId: string,
  actorName: string,
  fieldsChanged: string[]
) {
  return logActivity({
    ticketId,
    actorId,
    actorName,
    activityType: "edited",
    description: `Updated ticket: ${fieldsChanged.join(", ")}`,
    metadata: { fieldsChanged },
  });
}

/**
 * Get activity log for a ticket
 */
export async function getTicketActivityLog(ticketId: string, limit: number = 50) {
  return prisma.ticketActivityLog.findMany({
    where: { ticketId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
