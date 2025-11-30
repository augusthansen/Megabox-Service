# Service Tech Workflow & HubSpot Integration Strategy

## Recommended Approach: Hybrid Model ✅

**HubSpot Mobile App** → Chat Communication (Respond to customer chats)  
**Custom App** → Ticket Management (View details, update status, track time)

## Why This Approach?

### ✅ Advantages

1. **Best User Experience**
   - Techs get native iOS push notifications (reliable, instant)
   - Chat happens in HubSpot mobile app (optimized for messaging)
   - Ticket management happens in custom app (optimized for service work)
   - Each app does what it does best

2. **Efficient Communication**
   - Tech receives notification → taps → responds immediately in HubSpot
   - No need to switch apps during active chat conversation
   - HubSpot mobile app is purpose-built for chat communication

3. **Complete Context for Ticket Work**
   - Machine details, service history, site information in custom app
   - Time tracking integrated with ticket work
   - Technical notes, photos, videos all together
   - Update ticket status, add notes, track time in one place

4. **Cost Effective**
   - Leverage HubSpot's robust notification and chat infrastructure
   - Don't need to build/maintain push notification system
   - Focus development on core service features (ticket management, machine details)

### ❌ Why NOT Full HubSpot Mobile App?

1. **Limited Context**
   - HubSpot doesn't have machine-specific details
   - No service history, manuals, or technical documentation
   - Can't track time/cost within HubSpot mobile app

2. **Context Switching**
   - Tech would need to switch between HubSpot and your app constantly
   - Lose focus and efficiency
   - Higher chance of errors

3. **Missing Features**
   - No machine diagnostics
   - No site floor plans
   - No integrated time tracking
   - No video chat integration

## Implementation Plan

### Phase 1: Mobile Optimization (Current Priority) 🎯

**Goal:** Ensure custom app works perfectly on mobile devices

**Tasks:**
1. ✅ Verify responsive design for ticket list
2. ✅ Verify responsive design for ticket detail page
3. ✅ Optimize chat button for mobile
4. ✅ Test video chat on mobile
5. ✅ Ensure forms are mobile-friendly
6. ✅ Add mobile navigation improvements

**Status:** App is already built with Tailwind CSS (mobile-first), but needs verification

### Phase 2: HubSpot User Integration

**Goal:** Link service tech users to HubSpot contacts

**Tasks:**
1. **Sync Service Tech Users to HubSpot**
   - When creating a service tech user in app, create/link HubSpot contact
   - Store HubSpot contact ID in user record
   - Ensure tech can log into HubSpot mobile app with same email

2. **HubSpot Mobile App Setup**
   - Tech downloads HubSpot mobile app
   - Logs in with same email as app account
   - Receives chat notifications for assigned tickets

3. **Deep Linking (Future Enhancement)**
   - Configure HubSpot notifications to deep link to custom app
   - When tech taps notification, opens custom app directly to ticket
   - Requires app URL scheme configuration

### Phase 3: Notification Flow

**Recommended Flow:**
```
1. Customer starts chat in custom app (via "Chat Now" button)
2. Chat appears in HubSpot (via widget integration)
3. Tech receives notification in HubSpot mobile app
4. Tech taps notification → Opens chat directly in HubSpot mobile app
5. Tech responds to customer directly in HubSpot mobile app ✅
6. For ticket management (status updates, time tracking, notes):
   - Tech opens custom app separately
   - Views ticket details, machine info, service history
   - Updates ticket status, adds technical notes
   - Tracks time spent
   - All updates sync to HubSpot automatically
```

**Why This Works Best:**
- ✅ Tech responds immediately in HubSpot (no app switching during chat)
- ✅ HubSpot mobile app is optimized for chat communication
- ✅ Custom app is used for detailed ticket work and management
- ✅ Both systems stay in sync automatically

## Technical Implementation

### 1. Sync Service Tech Users to HubSpot

**File:** `app/api/users/route.ts` (POST handler)

**Changes Needed:**
- When creating a `service_tech` user, also create/link HubSpot contact
- Use `createContactInHubspot()` from `lib/hubspot.ts`
- Store `hubspotId` in user record

**Code Example:**
```typescript
// In POST handler for creating users
if (role === "service_tech") {
  // Create contact in HubSpot
  const hubspotContact = await createContactInHubspot({
    email: email,
    firstName: name.split(" ")[0],
    lastName: name.split(" ").slice(1).join(" ") || "",
  });
  
  // Store HubSpot ID
  userData.hubspotId = hubspotContact.id;
}
```

### 2. HubSpot Mobile App Configuration

**Steps for Techs:**
1. Download HubSpot mobile app from App Store
2. Log in with same email as app account
3. Enable notifications for conversations
4. Tech will receive chat notifications for tickets they're assigned to

**Note:** HubSpot automatically routes chats to assigned contacts if ticket assignment is synced.

### 3. Deep Linking (Optional Future Enhancement)

**Requirements:**
- Configure app URL scheme (e.g., `megaboxservice://ticket/{id}`)
- Update HubSpot notification settings to use deep links
- Handle deep link routing in Next.js app

**This is advanced and can be added later if needed.**

## Current State Analysis

### ✅ What's Already Working

1. **Chat Integration**
   - HubSpot chat widget embedded in custom app (for customers)
   - Customer can start chat from ticket page
   - Chat appears in HubSpot where techs can respond
   - Chat sessions tracked for time/cost

2. **User Identification**
   - Customer name, company, ticket number shown in HubSpot chat
   - Techs can identify who they're chatting with in HubSpot

3. **Ticket Assignment**
   - Tickets can be assigned to service techs
   - Service techs see only their assigned tickets in custom app
   - Assignment syncs to HubSpot (techs receive notifications for assigned tickets)

4. **Mobile-Responsive Design**
   - App built with Tailwind CSS (mobile-first)
   - Should work on mobile, but needs verification

5. **Service Tech HubSpot Integration** ✅ **NEW**
   - Service tech users automatically synced to HubSpot contacts
   - Techs can log into HubSpot mobile app with same email
   - Techs receive chat notifications for assigned tickets

### ⚠️ What Needs Work

1. **Mobile Optimization**
   - Need to verify mobile experience for custom app
   - May need mobile-specific UI improvements for ticket management

2. **Documentation for Techs**
   - Create simple guide: "How to use HubSpot mobile app for chats"
   - Create guide: "How to use custom app for ticket management"
   - Clarify when to use which app

## Recommended Next Steps

### Immediate (This Week)
1. ✅ **Sync service tech users to HubSpot** - COMPLETED
   - Service tech users automatically create HubSpot contacts
   - Techs can log into HubSpot mobile app

2. ✅ **Verify mobile experience**
   - Test custom app on iPhone (for ticket management)
   - Fix any mobile UI issues
   - Ensure ticket list/detail pages work well on mobile

3. ✅ **Document workflow for techs**
   - Create guide: "Using HubSpot Mobile App for Customer Chats"
   - Create guide: "Using Custom App for Ticket Management"
   - Clarify: Chat in HubSpot, Ticket work in Custom App

### Short Term (Next 2 Weeks)
1. **Mobile UI improvements**
   - Optimize ticket list for mobile
   - Improve mobile navigation
   - Add mobile-specific features (swipe actions, etc.)

2. **Enhanced notifications**
   - Consider adding in-app notifications
   - Improve notification flow documentation

### Long Term (Future)
1. **Deep linking**
   - Configure app URL scheme
   - Set up HubSpot deep link integration

2. **Push notifications (custom)**
   - If HubSpot notifications aren't sufficient
   - Build custom push notification system

## Alternative: Full Custom App Approach

**If you want everything in the custom app:**

### Pros:
- Single interface
- Full control
- No dependency on HubSpot mobile app

### Cons:
- Need to build push notification system
- More development work
- Need to maintain notification infrastructure
- iOS push notifications require Apple Developer account ($99/year)

### Implementation:
- Use service workers for web push notifications
- Or build native mobile app (React Native)
- Significant additional development

## Recommendation Summary

**✅ Use Hybrid Approach:**
- **HubSpot mobile app** → Chat communication (tech responds to customer chats here)
- **Custom app** → Ticket management (view details, update status, track time, add notes)
- Best of both worlds: Each app does what it does best
- Minimal additional development
- Best user experience: No app switching during active chat

**Workflow:**
1. Customer starts chat in custom app → Chat appears in HubSpot
2. Tech receives notification in HubSpot mobile app
3. Tech taps notification → Responds directly in HubSpot ✅
4. For ticket work (status updates, time tracking, notes) → Tech uses custom app
5. Both systems stay in sync automatically

**Next Action:** Verify mobile experience for custom app (ticket management), create user guides.

