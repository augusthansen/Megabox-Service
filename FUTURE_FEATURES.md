# 🗺️ Future Features

This document tracks planned features and enhancements for the Megabox Service Platform.

## Map Integration with Site Location Pins

### Overview
Add an interactive map feature that displays all customer site locations with pins. This will enhance both the tech and end-user experience by providing visual context for service locations.

### Use Cases

1. **For Techs:**
   - Visualize all sites they need to service
   - Plan routes efficiently
   - See site locations at a glance
   - Quick access to site details from map pins

2. **For Customers:**
   - View all their site locations on a map
   - Understand geographic distribution
   - Visual reference for site management

3. **For Admins:**
   - Overview of all customer sites
   - Geographic distribution analysis
   - Service area planning

### Implementation Considerations

**When to Add:**
- After core functionality is stable (Phase 3 or Phase 4)
- When site address data is consistently populated
- After customer portal or tech dashboard is built

**Technical Options:**

1. **Google Maps API**
   - Pros: Widely used, good documentation, free tier available
   - Cons: Requires API key, usage limits on free tier
   - Best for: Quick implementation, familiar interface

2. **Mapbox**
   - Pros: Highly customizable, good performance, generous free tier
   - Cons: Requires API key, learning curve for customization
   - Best for: Custom styling, advanced features

3. **Leaflet (OpenStreetMap)**
   - Pros: Free, open source, no API key needed
   - Cons: Less polished default styling, requires more setup
   - Best for: Cost-sensitive, open-source preference

**Recommended Approach:**
- Start with Google Maps (easiest integration)
- Use React component library (e.g., `@react-google-maps/api`)
- Store geocoded coordinates in database (lat/lng) for performance
- Cache geocoding results to avoid repeated API calls

**Database Changes Needed:**
```prisma
model Site {
  // ... existing fields
  latitude  Float?
  longitude Float?
  // Add geocoding fields for performance
}
```

**Features to Include:**
- [ ] Map view showing all sites with pins
- [ ] Click pin to show site details popup
- [ ] Filter by customer/company
- [ ] Search by address or site name
- [ ] Route planning for techs (future enhancement)
- [ ] Cluster pins when zoomed out
- [ ] Different pin colors for different statuses (optional)

**Pages to Add Map To:**
- Admin: `/admin/sites` - Add map view toggle
- Customer Portal: `/customer/sites` - Show customer's sites
- Tech Dashboard: `/tech/sites` - Show assigned sites
- Individual Site Detail: Show single site on map

### Estimated Effort
- **Initial Implementation:** 2-3 days
  - Set up map library
  - Add geocoding API integration
  - Create map component
  - Add to sites list page

- **Enhanced Features:** 1-2 days
  - Site detail popups
  - Filtering/search
  - Route planning

### Dependencies
- Site addresses must be populated (address, city, state, zipCode)
- API key for chosen map provider
- Geocoding service (can use map provider's geocoding API)

---

## Other Future Features

*Add more future features here as they come up...*

