import { prisma } from "@/lib/prisma";

type NotificationType =
  | "ticket_assigned"
  | "ticket_status_change"
  | "new_chat_message"
  | "communication_request"
  | "queue_update"
  | "ticket_created"
  | "priority_change"
  | "ticket_resolved"
  | "system";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  ticketId?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, link, ticketId } = params;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        ticketId,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Notify a tech when they're assigned to a ticket
 */
export async function notifyTicketAssignment(
  techId: string,
  ticketNumber: string,
  ticketId: string,
  companyName: string
) {
  return createNotification({
    userId: techId,
    type: "ticket_assigned",
    title: "New Ticket Assigned",
    message: `You've been assigned to ticket #${ticketNumber} from ${companyName}`,
    link: `/admin/tickets/${ticketId}`,
    ticketId,
  });
}

/**
 * Notify relevant users when ticket status changes
 */
export async function notifyTicketStatusChange(
  userId: string,
  ticketNumber: string,
  ticketId: string,
  oldStatus: string,
  newStatus: string,
  isAdmin: boolean
) {
  const basePath = isAdmin ? "/admin" : "/customer";
  return createNotification({
    userId,
    type: "ticket_status_change",
    title: "Ticket Status Updated",
    message: `Ticket #${ticketNumber} status changed from ${oldStatus} to ${newStatus}`,
    link: `${basePath}/tickets/${ticketId}`,
    ticketId,
  });
}

/**
 * Notify when a new chat message is received
 */
export async function notifyNewChatMessage(
  recipientId: string,
  senderName: string,
  ticketNumber: string,
  ticketId: string,
  isAdmin: boolean
) {
  const basePath = isAdmin ? "/admin" : "/customer";
  return createNotification({
    userId: recipientId,
    type: "new_chat_message",
    title: "New Message",
    message: `${senderName} sent a message on ticket #${ticketNumber}`,
    link: `${basePath}/tickets/${ticketId}`,
    ticketId,
  });
}

/**
 * Notify tech about a communication request
 */
export async function notifyCommunicationRequest(
  techId: string,
  requestType: string,
  customerName: string,
  ticketNumber: string,
  ticketId: string
) {
  const typeLabel =
    requestType === "video_call"
      ? "Video Call"
      : requestType === "phone_call"
      ? "Phone Call"
      : "Chat";

  return createNotification({
    userId: techId,
    type: "communication_request",
    title: `${typeLabel} Request`,
    message: `${customerName} requested a ${typeLabel.toLowerCase()} for ticket #${ticketNumber}`,
    link: `/admin/tickets/${ticketId}`,
    ticketId,
  });
}

/**
 * Notify admins when a new ticket is created
 */
export async function notifyNewTicket(
  adminId: string,
  ticketNumber: string,
  ticketId: string,
  companyName: string,
  subject: string
) {
  return createNotification({
    userId: adminId,
    type: "ticket_created",
    title: "New Ticket Created",
    message: `${companyName}: ${subject}`,
    link: `/admin/tickets/${ticketId}`,
    ticketId,
  });
}

/**
 * Get all service techs to notify about new tickets
 */
export async function getServiceTechIds(): Promise<string[]> {
  const techs = await prisma.user.findMany({
    where: {
      role: { in: ["service_tech", "super_admin"] },
      isActive: true,
    },
    select: { id: true },
  });
  return techs.map((t) => t.id);
}
