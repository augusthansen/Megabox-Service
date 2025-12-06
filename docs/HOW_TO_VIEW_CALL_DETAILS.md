# How to View Phone Call Details

## Overview

Phone call details are available in multiple places throughout the app. This guide shows you where to find all the information about each phone call.

## Location 1: Communication Requests Section (Most Detailed)

### Where to Find It:
1. Navigate to **Admin** → **Tickets**
2. Click on any ticket to open the **Ticket Detail Page**
3. Scroll down to the **"Communication Requests"** section

### What You'll See:
For **completed phone calls**, you'll see a detailed **"Call Details"** card that includes:

- ✅ **Duration**: Total call length in minutes
- ✅ **Cost**: Total cost of the call (if you're an admin)
- ✅ **Recording**: Click "Listen to Recording" to hear the full call
- ✅ **Transcription**: Full text transcription of the call (when available)
- ✅ **Resolution Status**: Dropdown to view/update if the call:
  - Resolved the issue
  - Issue is ongoing
  - Needs follow-up

### How to Use:
- **Listen to Recording**: Click the "Listen to Recording" link to open the Twilio recording in a new tab
- **Read Transcription**: Scroll down in the Call Details card to see the full transcription
- **Update Resolution Status**: Use the dropdown to mark the call's outcome

---

## Location 2: Time & Cost Section (Quick Summary)

### Where to Find It:
1. Navigate to **Admin** → **Tickets**
2. Click on any ticket to open the **Ticket Detail Page**
3. Look for the **"Time & Cost"** section (or "Time Tracking" for service techs)

### What You'll See:
A **"Recent Sessions"** list showing all sessions including phone calls with:
- Session type (e.g., "phone call")
- Duration in minutes
- Cost (for admins only)
- Date
- **🎧 Recording link** (if available)
- **Resolution status** (if set)
- **View Transcription** expandable section (if available)

### How to Use:
- Click the **🎧 Recording** link to listen to the call
- Click **"View Transcription"** to expand and read the full transcription
- See the resolution status color-coded:
  - 🟢 **Green**: Resolved
  - 🟡 **Yellow**: Ongoing
  - 🟠 **Orange**: Needs Follow-up

---

## Location 3: Database (Advanced)

If you need to query all calls programmatically or view raw data:

### Using Prisma Studio:
1. Run: `npm run db:studio`
2. Navigate to the **Session** table
3. Filter by `sessionType = "phone_call"`
4. View all fields including:
   - `callRecordingUrl`
   - `callTranscription`
   - `callResolutionStatus`
   - `callRecordingSid`
   - `callTranscriptionSid`

### Using API:
- `GET /api/tickets/[id]` - Returns ticket with all sessions
- `GET /api/communication-requests?ticketId=[id]` - Returns all communication requests for a ticket

---

## What Information is Available?

For each phone call, you can access:

| Field | Description | Where to Find |
|-------|-------------|---------------|
| **Duration** | Call length in minutes | Communication Requests, Time & Cost |
| **Cost** | Total call cost | Communication Requests, Time & Cost (admins only) |
| **Recording** | Audio recording URL | Communication Requests, Time & Cost |
| **Transcription** | Full text of the call | Communication Requests, Time & Cost |
| **Resolution Status** | Was issue resolved? | Communication Requests (editable) |
| **Start Time** | When call started | Time & Cost section |
| **End Time** | When call ended | Time & Cost section |
| **Tech** | Who made the call | Time & Cost section |

---

## Tips

1. **Recordings take time**: After a call ends, it may take 1-2 minutes for the recording to appear
2. **Transcriptions take longer**: Transcriptions are created automatically but may take 3-5 minutes after the recording is ready
3. **Update resolution status**: Make sure to set the resolution status after each call for better tracking
4. **Multiple calls per ticket**: A ticket can have multiple phone calls - each will appear separately in the Communication Requests section

---

## Troubleshooting

### Recording Not Showing?
- Check that the call was completed (status = "completed")
- Wait 1-2 minutes for Twilio to process the recording
- Check server logs for `[Twilio Recording]` messages
- Verify TwiML App has recording enabled

### Transcription Not Available?
- Transcriptions are created automatically but may take 3-5 minutes
- Check Twilio Console → Monitor → Logs → Transcriptions
- Not all calls will have transcriptions (depends on Twilio processing)

### Can't See Cost?
- Cost is only visible to `super_admin` users
- Service techs will only see duration, not cost
- Cost is calculated based on company's hourly rate and call duration

---

## Quick Reference

**Best place for detailed call info**: Communication Requests section on ticket detail page

**Best place for quick overview**: Time & Cost section on ticket detail page

**Best place for all calls across tickets**: Currently not available - would require a new "Calls" page (future enhancement)

