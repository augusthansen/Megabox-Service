import { z } from "zod";

/**
 * Shared Zod validation schemas for API routes
 */

// Common ID validation
export const idSchema = z.string().cuid();

// Customer/Company schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  pricingTier: z.enum(["basic", "standard", "mega"]).optional(),
  pricePerMachine: z.number().positive().optional(),
  hourlyRate: z.number().positive().optional(),
  sites: z
    .array(
      z.object({
        name: z.string().min(1, "Site name is required").max(255),
        address: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        zipCode: z.string().max(20).optional(),
        contactName: z.string().max(255).optional(),
        contactPhone: z.string().max(50).optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
      })
    )
    .optional(),
});

// Site schemas
export const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(255),
  companyId: z.string().cuid("Invalid company ID"),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

// Machine schemas
export const createMachineSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  siteId: z.string().cuid("Invalid site ID"),
  name: z.string().max(255).optional(),
  series: z.string().max(100).optional(),
  windowsVersion: z.string().max(50).optional(),
  directConnectVersion: z.string().max(50).optional(),
  firmwareVersion: z.string().max(50).optional(),
  configuration: z.record(z.unknown()).optional(),
  status: z.string().max(50).optional(),
  isCurrentlyDown: z.boolean().optional(),
  hasRemoteAccess: z.boolean().optional(),
  remoteAccessType: z.string().max(50).optional(),
  remoteAccessId: z.string().max(255).optional(),
});

// Ticket schemas
export const createTicketSchema = z.object({
  companyId: z.string().cuid("Invalid company ID"),
  siteId: z.string().cuid("Invalid site ID"),
  machineId: z.string().cuid("Invalid machine ID").optional().or(z.literal("")),
  createdById: z.string().cuid("Invalid user ID"),
  subject: z.string().min(1, "Subject is required").max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  machineDown: z.boolean().default(false),
});

export const updateTicketSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z
    .enum(["open", "assigned", "in_progress", "on_hold", "resolved", "closed"])
    .optional(),
  assignedToId: z.string().cuid().optional().nullable(),
  machineDown: z.boolean().optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const ticketFiltersSchema = z.object({
  status: z
    .enum(["open", "assigned", "in_progress", "on_hold", "resolved", "closed"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  companyId: z.string().cuid().optional(),
  siteId: z.string().cuid().optional(),
  machineId: z.string().cuid().optional(),
});

// Helper to validate and return errors
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError.message,
    };
  }
  return { success: true, data: result.data };
}
