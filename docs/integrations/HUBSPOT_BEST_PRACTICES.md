# HubSpot Integration Best Practices for Megabox Service Platform

## Understanding HubSpot Terminology

### Service Hub vs Help Desk vs Tickets

- **Service Hub**: This is HubSpot's product suite for customer service (what you're paying for)
- **Help Desk**: The workspace/interface within Service Hub where support teams manage tickets
- **Tickets**: The actual CRM object type that represents support requests

**Bottom line:** They're all connected! When you use the **Tickets API** (which we currently do), you're accessing the tickets from your **Service Hub/Help Desk**.

### What We're Currently Using ✅

**HubSpot Tickets API** - This is the correct approach! The Tickets API gives you access to:
- All tickets from your Service Hub/Help Desk
- Ticket properties (status, priority, subject, description)
- Associations (companies, contacts)
- Custom properties
- Ticket history

## Current Implementation Review

### What's Working Well ✅

1. **Two-Way Sync**: Tickets created/updated in your app automatically sync to HubSpot
2. **Company Associations**: Tickets are linked to the correct companies
3. **Status/Priority Mapping**: Ticket states are properly synchronized
4. **Direct Links**: Users can click to view tickets in HubSpot for advanced features
5. **Filtered Company Sync**: Only companies with service plans are synced

### Recommended Enhancements 🚀

Here are improvements that would make your HubSpot integration even better:

## Enhancement Recommendations

### Priority 1: Contact Associations (HIGH VALUE)

**Why:** Right now tickets are associated with companies, but not specific contacts (people)

**Benefit:**
- Know which person at the company submitted the ticket
- Better communication tracking
- More context for support teams

**Implementation:**
```typescript
// When creating a ticket, associate it with both company AND contact
const ticket = await createTicketInHubspot({
  subject: "Machine Down",
  companyId: company.hubspotId,
  contactId: contact.hubspotId, // Add contact association
  // ...
});
```

**Required Changes:**
1. Add `hubspotId` to users table (for customer users)
2. Sync HubSpot contacts to your users table
3. Update ticket creation to include contact association

---

### Priority 2: Ticket Pipelines & Stages (MEDIUM VALUE)

**Why:** Service Hub uses pipelines and stages for workflow management

**Benefit:**
- Track tickets through your support process
- Better reporting and analytics
- Custom workflows per ticket type

**Implementation:**
- Map your ticket statuses to HubSpot ticket stages
- Support multiple pipelines (e.g., "Break/Fix" vs "Preventive Maintenance")
- Sync pipeline position when updating tickets

**Example Pipelines:**
```
Pipeline: Break/Fix Support
├── New Request
├── Parts Ordered
├── Scheduled
├── In Progress
├── Testing
└── Completed

Pipeline: Preventive Maintenance
├── Scheduled
├── In Progress
├── Follow-up Required
└── Completed
```

---

### Priority 3: SLA Tracking (HIGH VALUE)

**Why:** Service plans should have guaranteed response/resolution times

**Benefit:**
- Track response time commitments
- Automatic escalation for overdue tickets
- Service level reporting for customers

**Implementation:**
1. Define SLA tiers in HubSpot (based on your pricing tiers)
2. Sync SLA data when fetching tickets
3. Display SLA status in your app
4. Alert technicians when SLAs are at risk

**Example:**
- **Premium Plan**: 2-hour response, 24-hour resolution
- **Professional Plan**: 4-hour response, 48-hour resolution
- **Standard Plan**: 8-hour response, 72-hour resolution

---

### Priority 4: Webhook Integration (MEDIUM VALUE)

**Why:** Right now you manually click "Sync from HubSpot" to pull updates

**Benefit:**
- Real-time updates when tickets change in HubSpot
- No manual syncing required
- Better data consistency

**Implementation:**
1. Set up HubSpot webhook in your HubSpot account
2. Create webhook endpoint in your app: `/api/webhooks/hubspot`
3. Verify webhook signatures for security
4. Update local tickets when webhook fires

**Webhook Events to Subscribe:**
- `ticket.creation`
- `ticket.propertyChange`
- `ticket.deletion`

---

### Priority 5: Custom Properties Sync (MEDIUM VALUE)

**Why:** You might have custom fields in HubSpot that aren't syncing

**Benefit:**
- Sync custom data (machine model, part numbers, etc.)
- Better reporting
- Preserve all ticket context

**Implementation:**
- Define which custom properties to sync
- Update sync functions to include custom properties
- Add fields to your ticket model if needed

**Example Custom Properties:**
- `machine_model`
- `parts_required`
- `estimated_completion_date`
- `customer_satisfaction_score`

---

### Priority 6: Attachment Sync (LOW-MEDIUM VALUE)

**Why:** Photos, documents, and files attached to tickets

**Benefit:**
- Technicians can see machine photos from HubSpot
- Invoices and documentation stay in sync
- Complete ticket history

**Implementation:**
- Sync HubSpot ticket attachments to your database
- Upload attachments from your app to HubSpot
- Store files in cloud storage (AWS S3, Cloudflare R2, etc.)

---

### Priority 7: Comment/Note Sync (MEDIUM-HIGH VALUE)

**Why:** Ticket conversations and updates happen in both places

**Benefit:**
- Complete communication history
- Notes from HubSpot support visible to technicians
- Customer updates sync back to HubSpot

**Implementation:**
- Sync HubSpot ticket notes/engagements
- Post comments from your app to HubSpot
- Display full conversation timeline in ticket detail page

---

## Recommended Workflow: How to Use Both Systems

### Use Your App For:
1. **Field Technician Work**
   - View assigned tickets
   - Update ticket status in real-time
   - Add technical notes (machine diagnostics, parts used)
   - Track time spent
   - Machine-specific context (alarms, history, manuals)

2. **Quick Ticket Overview**
   - Dashboard view of all open tickets
   - Filter by site, machine, priority
   - Visual machine status

3. **Machine & Site Management**
   - Machine inventory
   - Alarm monitoring
   - Service history
   - Floor maps

### Use HubSpot Service Hub For:
1. **Customer Communication**
   - Email correspondence with customers
   - Phone call logging
   - Customer-facing updates
   - Knowledge base articles

2. **Advanced Ticket Management**
   - Complex workflows and automation
   - SLA tracking and reporting
   - Customer satisfaction surveys
   - Escalation rules

3. **Reporting & Analytics**
   - Service performance metrics
   - Customer health scores
   - Revenue reporting
   - Team productivity

### The Ideal Flow:

```
1. Customer emails support → HubSpot creates ticket automatically
2. Your app syncs the ticket (via webhook or manual sync)
3. Service manager assigns ticket to technician in your app
4. Technician sees ticket on mobile app with machine details
5. Technician updates status, adds notes → syncs to HubSpot
6. Customer service rep in HubSpot sees update, emails customer
7. Ticket resolved in your app → HubSpot ticket automatically closed
8. HubSpot sends satisfaction survey to customer
```

---

## Next Steps for Enhancement

### Phase 1: Foundation (Already Complete ✅)
- [x] Basic ticket sync
- [x] Company associations
- [x] Two-way status/priority sync
- [x] Direct links to HubSpot

### Phase 2: Enhanced Integration (Recommended Next)
- [ ] Contact associations
- [ ] Ticket pipelines/stages
- [ ] Comment/note sync
- [ ] Webhook integration for real-time updates

### Phase 3: Advanced Features
- [ ] SLA tracking and alerts
- [ ] Custom property sync
- [ ] Attachment sync
- [ ] Customer portal integration

### Phase 4: Automation & Intelligence
- [ ] Automatic ticket creation from machine alarms
- [ ] Predictive maintenance tickets
- [ ] Smart assignment based on technician location/skills
- [ ] Customer self-service portal

---

## Configuration Recommendations

### HubSpot Service Hub Settings

1. **Ticket Pipelines**
   - Create a "Field Service" pipeline
   - Customize stages to match your workflow
   - Set automation rules for stage transitions

2. **Ticket Properties**
   - Add custom properties: `machine_id`, `machine_serial_number`, `site_id`
   - Create `service_plan_tier` property
   - Add `machine_down` checkbox (HIGH priority indicator)

3. **SLA Policies**
   - Define response time SLAs by service tier
   - Set resolution time SLAs
   - Configure escalation rules

4. **Automation Workflows**
   - Auto-assign tickets based on site/region
   - Escalate overdue tickets
   - Send customer notifications
   - Request satisfaction surveys after resolution

5. **Email Integration**
   - Set up `support@megaboxservice.com` → HubSpot
   - Configure email templates
   - Enable threading for better context

---

## Summary

**Should you use HubSpot Help Desk or Tickets?**
✅ You're already using it correctly! The Tickets API accesses your Service Hub/Help Desk tickets.

**Best way to integrate:**
1. **Keep your current implementation** - it's solid!
2. **Add contact associations** (Priority 1) - so tickets link to specific people
3. **Implement webhooks** (Priority 4) - for real-time updates
4. **Add comment sync** (Priority 7) - for complete conversation history
5. **Consider SLA tracking** (Priority 3) - for service level guarantees

**The ideal setup:**
- **Your app** = Technician workspace + Machine management
- **HubSpot** = Customer communication + Advanced workflows
- **Both systems stay in sync automatically**

This gives you the best of both worlds: powerful machine/field service management in your custom app, plus enterprise-grade customer service tools in HubSpot.

---

Need help implementing any of these enhancements? Let me know which priority you'd like to tackle first!

