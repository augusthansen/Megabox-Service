import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDailyRoom } from "@/lib/daily";

/**
 * Single Communication Request API Route
 * 
 * GET: Fetch a single communication request
 * PATCH: Update communication request (accept, decline, schedule, start, complete)
 * DELETE: Cancel a communication request
 */

// GET - Fetch a single communication request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const request = await prisma.communicationRequest.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            site: {
              select: {
                id: true,
                name: true,
                primaryContact: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        session: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            cost: true,
            callRecordingUrl: true,
            callRecordingSid: true,
            callTranscription: true,
            callTranscriptionSid: true,
            callResolutionStatus: true,
            notes: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Communication request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(request);
  } catch (error: any) {
    console.error("Error fetching communication request:", error);
    return NextResponse.json(
      { error: "Failed to fetch communication request", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH - Update communication request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      scheduledTime,
      techNotes,
      action, // "accept", "decline", "schedule", "start", "complete", "cancel"
    } = body;

    // Get the current request
    const currentRequest = await prisma.communicationRequest.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            assignedToId: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!currentRequest) {
      return NextResponse.json(
        { error: "Communication request not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let newStatus = status;

    // Handle actions
    if (action === "accept") {
      newStatus = scheduledTime ? "scheduled" : "accepted";
      updateData.acceptedAt = new Date();
      if (scheduledTime) {
        updateData.scheduledTime = new Date(scheduledTime);
      }
      // Ensure assignedToId is set if not already set
      if (!currentRequest.assignedToId && currentRequest.ticket.assignedToId) {
        updateData.assignedToId = currentRequest.ticket.assignedToId;
      }
    } else if (action === "decline") {
      newStatus = "declined";
    } else if (action === "schedule") {
      if (!scheduledTime) {
        return NextResponse.json(
          { error: "Scheduled time is required" },
          { status: 400 }
        );
      }
      newStatus = "scheduled";
      updateData.scheduledTime = new Date(scheduledTime);
      updateData.acceptedAt = new Date();
    } else if (action === "start") {
      newStatus = "in_progress";
      // Create a session when starting
      const sessionType = currentRequest.requestType === "phone_call" ? "phone_call" : 
                         currentRequest.requestType === "video_call" ? "video_call" : "chat";
      
      let sessionData: any = {
        ticketId: currentRequest.ticketId,
        techId: currentRequest.assignedToId!,
        sessionType,
        startTime: new Date(),
      };

      // For video calls, create Daily.co room
      if (currentRequest.requestType === "video_call" && process.env.DAILY_API_KEY) {
        try {
          const room = await createDailyRoom(
            currentRequest.ticketId,
            currentRequest.ticket.ticketNumber
          );
          sessionData.videoRecordingUrl = room.url;
        } catch (error) {
          console.error("Error creating Daily.co room:", error);
          // Continue without room URL
        }
      }

      // Link the session to the communication request
      sessionData.communicationRequestId = id;

      const session = await prisma.session.create({
        data: sessionData,
      });

      updateData.sessionId = session.id;
    } else if (action === "complete") {
      newStatus = "completed";
      updateData.completedAt = new Date();
      
      // If no session exists, create one for phone calls
      if (!currentRequest.sessionId && currentRequest.requestType === "phone_call") {
        // Try to find an existing session for this communication request first
        let session = await prisma.session.findFirst({
          where: {
            communicationRequestId: id,
          },
        });
        
        if (!session) {
          // Calculate duration from accepted time to now, or use completedAt if available
          const startTime = currentRequest.acceptedAt || currentRequest.createdAt;
          const endTime = currentRequest.completedAt || new Date();
          const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          
          session = await prisma.session.create({
            data: {
              ticketId: currentRequest.ticketId,
              techId: currentRequest.assignedToId || currentRequest.ticket.assignedToId || "",
              sessionType: "phone_call",
              startTime: startTime,
              endTime: endTime,
              durationMinutes: durationMinutes,
              communicationRequestId: id,
            },
          });
          console.log("Created session for completed phone call:", session.id);
        } else {
          console.log("Found existing session for communication request:", session.id);
        }
        
        updateData.sessionId = session.id;
      }
      
      // End the session if it exists
      if (currentRequest.sessionId) {
        const session = await prisma.session.findUnique({
          where: { id: currentRequest.sessionId },
          select: {
            id: true,
            startTime: true,
            durationMinutes: true,
          },
        });
        
        if (session) {
          const endTime = new Date();
          const durationSeconds = session.durationMinutes 
            ? Math.round(session.durationMinutes * 60)
            : Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
          
          await prisma.session.update({
            where: { id: currentRequest.sessionId },
            data: {
              endTime,
            },
          });
          
          // Log phone calls to HubSpot when completed
          if (currentRequest.requestType === "phone_call" && currentRequest.customerPhone && process.env.HUBSPOT_API_KEY) {
            try {
              const { createCallActivityInHubspot } = await import("@/lib/hubspot");
              
              // Get ticket with HubSpot IDs
              const ticket = await prisma.ticket.findUnique({
                where: { id: currentRequest.ticketId },
                select: {
                  hubspotId: true,
                  company: {
                    select: {
                      hubspotId: true,
                    },
                  },
                  createdBy: {
                    select: {
                      hubspotId: true,
                    },
                  },
                },
              });
              
              await createCallActivityInHubspot({
                contactId: ticket?.createdBy?.hubspotId || undefined,
                companyId: ticket?.company?.hubspotId || undefined,
                ticketId: ticket?.hubspotId || undefined,
                phoneNumber: currentRequest.customerPhone,
                direction: "OUTBOUND",
                duration: durationSeconds,
                notes: currentRequest.techNotes || currentRequest.notes || undefined,
                subject: `Call completed: ${currentRequest.ticket.ticketNumber}`,
              });
            } catch (error) {
              console.error("Error logging completed call to HubSpot:", error);
              // Continue even if logging fails
            }
          }
        }
      }
    } else if (action === "cancel") {
      newStatus = "cancelled";
    }

    if (newStatus) {
      updateData.status = newStatus;
    }
    if (techNotes !== undefined) {
      updateData.techNotes = techNotes;
    }

    // Validate that we have something to update
    if (Object.keys(updateData).length === 0) {
      console.error("No update data provided for communication request");
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    console.log("Updating communication request:", { id, updateData });

    // Update the request
    const updatedRequest = await prisma.communicationRequest.update({
      where: { id },
      data: updateData,
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        session: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            cost: true,
            videoRecordingUrl: true,
            callRecordingUrl: true,
            callTranscription: true,
            callResolutionStatus: true,
            notes: true,
          },
        },
      },
    });

    // If this was a "start" action, include session data for automatic call initiation
    if (action === "start") {
      console.log("🚀 Start action - preparing auto-initiate data");
      console.log("Updated request:", {
        requestType: updatedRequest.requestType,
        customerPhone: updatedRequest.customerPhone,
        session: updatedRequest.session,
        ticketNumber: updatedRequest.ticket?.ticketNumber,
      });
      
      if (updatedRequest.session) {
        const autoInitiate = {
          requestType: updatedRequest.requestType,
          videoRecordingUrl: updatedRequest.session.videoRecordingUrl,
          customerPhone: updatedRequest.customerPhone,
          ticketNumber: updatedRequest.ticket?.ticketNumber,
        };
        console.log("✅ Returning with _autoInitiate:", autoInitiate);
        return NextResponse.json({
          ...updatedRequest,
          _autoInitiate: autoInitiate,
        });
      } else {
        console.warn("⚠️ No session found for start action, but returning request anyway");
        // Still return the request even if no session, so frontend can use request data
        return NextResponse.json({
          ...updatedRequest,
          _autoInitiate: {
            requestType: updatedRequest.requestType,
            videoRecordingUrl: null,
            customerPhone: updatedRequest.customerPhone,
            ticketNumber: updatedRequest.ticket?.ticketNumber,
          },
        });
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error("========== Error updating communication request ==========");
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error name:", error?.name);
    console.error("Error stack:", error?.stack);
    console.error("Request ID:", id);
    console.error("Request body:", body);
    console.error("===========================================================");
    
    return NextResponse.json(
      { 
        error: "Failed to update communication request", 
        details: error?.message || "Unknown error",
        code: error?.code,
        name: error?.name,
      },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a communication request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Update status to cancelled instead of deleting
    const cancelledRequest = await prisma.communicationRequest.update({
      where: { id },
      data: {
        status: "cancelled",
      },
    });

    return NextResponse.json(cancelledRequest);
  } catch (error: any) {
    console.error("Error cancelling communication request:", error);
    return NextResponse.json(
      { error: "Failed to cancel communication request", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

