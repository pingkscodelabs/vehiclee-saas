import { bigint, date, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with Vehiclee-SaaS roles and company information.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "client", "driver"]).default("user").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  companyVatId: varchar("companyVatId", { length: 32 }),
  companyCountry: mysqlEnum("companyCountry", ["NL", "LV", "OTHER"]),
  kycStatus: mysqlEnum("kycStatus", ["pending", "approved", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Client (Advertiser) Profile
export const clientProfiles = mysqlTable("clientProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyVatId: varchar("companyVatId", { length: 32 }),
  companyCountry: mysqlEnum("companyCountry", ["NL", "LV", "OTHER"]).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  walletBalance: bigint("walletBalance", { mode: "number" }).default(0),
  totalSpent: bigint("totalSpent", { mode: "number" }).default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = typeof clientProfiles.$inferInsert;

// Driver Profile
export const driverProfiles = mysqlTable("driverProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  licenseNumber: varchar("licenseNumber", { length: 32 }),
  licenseExpiry: date("licenseExpiry"),
  documentStatus: mysqlEnum("documentStatus", ["pending", "approved", "rejected"]).default("pending"),
  documentReviewedAt: timestamp("documentReviewedAt"),
  documentReviewedBy: int("documentReviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverProfile = typeof driverProfiles.$inferSelect;
export type InsertDriverProfile = typeof driverProfiles.$inferInsert;

// Vehicle Registration
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull(),
  licensePlate: varchar("licensePlate", { length: 32 }).notNull().unique(),
  make: varchar("make", { length: 64 }),
  model: varchar("model", { length: 64 }),
  year: int("year"),
  color: varchar("color", { length: 32 }),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending"),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// E-Paper Device
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().unique(),
  deviceId: varchar("deviceId", { length: 64 }).notNull().unique(),
  deviceSecret: varchar("deviceSecret", { length: 255 }).notNull(),
  model: varchar("model", { length: 64 }),
  resolution: varchar("resolution", { length: 32 }),
  colorMode: varchar("colorMode", { length: 32 }),
  status: mysqlEnum("status", ["provisioning", "active", "offline", "error"]).default("provisioning"),
  lastHeartbeat: timestamp("lastHeartbeat"),
  lastContentHash: varchar("lastContentHash", { length: 64 }),
  currentImageUrl: text("currentImageUrl"),
  firmwareVersion: varchar("firmwareVersion", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusHeartbeatIdx: index("status_heartbeat_idx").on(table.status, table.lastHeartbeat),
}));

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// Device Telemetry
export const deviceTelemetry = mysqlTable("deviceTelemetry", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  heartbeatAt: timestamp("heartbeatAt"),
  contentHash: varchar("contentHash", { length: 64 }),
  uptime: int("uptime"),
  batteryLevel: int("batteryLevel"),
  signalStrength: int("signalStrength"),
  errorCode: varchar("errorCode", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  deviceHeartbeatIdx: index("device_heartbeat_idx").on(table.deviceId, table.heartbeatAt),
}));

export type DeviceTelemetry = typeof deviceTelemetry.$inferSelect;
export type InsertDeviceTelemetry = typeof deviceTelemetry.$inferInsert;

// Zones
export const zones = mysqlTable("zones", {
  id: int("id").autoincrement().primaryKey(),
  city: varchar("city", { length: 64 }).notNull(),
  zoneName: varchar("zoneName", { length: 128 }),
  polygonGeoJson: json("polygonGeoJson"),
  priceModifier: decimal("priceModifier", { precision: 3, scale: 2 }).default("1.0"),
  exclusivityFlag: int("exclusivityFlag").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Zone = typeof zones.$inferSelect;
export type InsertZone = typeof zones.$inferInsert;

// Campaign
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  campaignName: varchar("campaignName", { length: 255 }).notNull(),
  description: text("description"),
  city: varchar("city", { length: 64 }).notNull(),
  zoneId: int("zoneId"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  numberOfCars: int("numberOfCars").notNull(),
  dailyBudget: bigint("dailyBudget", { mode: "number" }).notNull(),
  totalBudget: bigint("totalBudget", { mode: "number" }).notNull(),
  status: mysqlEnum("status", ["draft", "awaiting_creative", "awaiting_approval", "approved", "active", "completed", "cancelled"]).default("draft"),
  complianceApprovedAt: timestamp("complianceApprovedAt"),
  complianceApprovedBy: int("complianceApprovedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusStartDateIdx: index("status_startDate_idx").on(table.status, table.startDate),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// Creative (Ad Content)
export const creatives = mysqlTable("creatives", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  assetUrl: text("assetUrl").notNull(),
  assetKey: varchar("assetKey", { length: 255 }).notNull(),
  creativeType: mysqlEnum("creativeType", ["template", "custom", "ai_generated"]).default("template"),
  templateId: varchar("templateId", { length: 64 }),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending"),
  clientApprovedAt: timestamp("clientApprovedAt"),
  complianceApprovedAt: timestamp("complianceApprovedAt"),
  complianceApprovedBy: int("complianceApprovedBy"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Creative = typeof creatives.$inferSelect;
export type InsertCreative = typeof creatives.$inferInsert;

// Campaign Allocation
export const campaignAllocations = mysqlTable("campaignAllocations", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  deviceId: int("deviceId").notNull(),
  allocationStartDate: date("allocationStartDate").notNull(),
  allocationEndDate: date("allocationEndDate").notNull(),
  status: mysqlEnum("status", ["scheduled", "active", "completed", "cancelled"]).default("scheduled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  campaignStatusIdx: index("campaign_status_idx").on(table.campaignId, table.status),
}));

export type CampaignAllocation = typeof campaignAllocations.$inferSelect;
export type InsertCampaignAllocation = typeof campaignAllocations.$inferInsert;

// Wallet Ledger
export const walletLedger = mysqlTable("walletLedger", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  transactionType: mysqlEnum("transactionType", ["topup", "spend", "refund", "adjustment"]).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  balanceBefore: bigint("balanceBefore", { mode: "number" }).notNull(),
  balanceAfter: bigint("balanceAfter", { mode: "number" }).notNull(),
  reference: varchar("reference", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  clientCreatedIdx: index("client_created_idx").on(table.clientId, table.createdAt),
}));

export type WalletLedgerEntry = typeof walletLedger.$inferSelect;
export type InsertWalletLedgerEntry = typeof walletLedger.$inferInsert;

// Invoice
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 32 }).notNull().unique(),
  campaignId: int("campaignId"),
  invoiceDate: date("invoiceDate").notNull(),
  dueDate: date("dueDate").notNull(),
  subtotal: bigint("subtotal", { mode: "number" }).notNull(),
  vatAmount: bigint("vatAmount", { mode: "number" }).notNull(),
  total: bigint("total", { mode: "number" }).notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  pdfUrl: text("pdfUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusDueIdx: index("status_due_idx").on(table.status, table.dueDate),
}));

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// Payout
export const payouts = mysqlTable("payouts", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull(),
  campaignAllocationId: int("campaignAllocationId").notNull(),
  earningAmount: bigint("earningAmount", { mode: "number" }).notNull(),
  formula: varchar("formula", { length: 255 }),
  activeDays: int("activeDays"),
  averageUptime: decimal("averageUptime", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["pending", "approved", "paid", "disputed"]).default("pending"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusCreatedIdx: index("status_created_idx").on(table.status, table.createdAt),
}));

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;

// Compliance Queue
export const complianceQueue = mysqlTable("complianceQueue", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["creative", "campaign", "driver"]).notNull(),
  entityId: int("entityId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "escalated"]).default("pending"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  rejectionReason: text("rejectionReason"),
  restrictedCategories: json("restrictedCategories"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusCreatedIdx: index("status_created_idx").on(table.status, table.createdAt),
}));

export type ComplianceQueueEntry = typeof complianceQueue.$inferSelect;
export type InsertComplianceQueueEntry = typeof complianceQueue.$inferInsert;

// Support Tickets
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticketType: mysqlEnum("ticketType", ["driver_issue", "campaign_issue", "payment_issue", "device_issue", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  assignedTo: int("assignedTo"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusPriorityIdx: index("status_priority_idx").on(table.status, table.priority, table.createdAt),
}));

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// Audit Log
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  changes: json("changes"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  entityTypeIdIdx: index("entityType_id_idx").on(table.entityType, table.entityId, table.createdAt),
}));

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;