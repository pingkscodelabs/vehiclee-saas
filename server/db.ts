import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clientProfiles,
  driverProfiles,
  vehicles,
  devices,
  campaigns,
  creatives,
  campaignAllocations,
  walletLedger,
  invoices,
  payouts,
  complianceQueue,
  supportTickets,
  auditLog,
  zones,
  deviceTelemetry,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// Client queries
export async function getClientProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function getClientCampaigns(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.clientId, clientId));
}

export async function getWalletBalance(clientId: number) {
  const db = await getDb();
  if (!db) return 0;
  const profile = await db.select().from(clientProfiles).where(eq(clientProfiles.id, clientId)).limit(1);
  return profile[0]?.walletBalance ?? 0;
}

// Driver queries
export async function getDriverProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function getDriverVehicles(driverId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
}

export async function getDeviceByVehicle(vehicleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices).where(eq(devices.vehicleId, vehicleId)).limit(1);
  return result[0];
}

// Device queries
export async function getDeviceStatus(deviceId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices).where(eq(devices.deviceId, deviceId)).limit(1);
  return result[0];
}

// Compliance queries
export async function getComplianceQueue(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(complianceQueue).where(eq(complianceQueue.status, status as any));
  }
  return db.select().from(complianceQueue);
}

// Payout queries
export async function getDriverPayouts(driverId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payouts).where(eq(payouts.driverId, driverId));
}

// Support ticket queries
export async function getUserTickets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).where(eq(supportTickets.userId, userId));
}

// Audit log
export async function createAuditLog(
  userId: number | null,
  action: string,
  entityType: string | null,
  entityId: number | null,
  changes: Record<string, unknown> | null,
  reason: string | null
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values({
    userId,
    action,
    entityType,
    entityId,
    changes,
    reason,
  });
}
