import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  getDb,
  createAuditLog,
} from "../db";
import {
  devices,
  deviceTelemetry,
  vehicles,
  driverProfiles,
  campaignAllocations,
  campaigns,
} from "../../drizzle/schema";

function ensureRole(ctx: any, role: string) {
  if (ctx.user?.role !== role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires ${role} role`,
    });
  }
}

export const fleetRouter = router({
  getFleetOverview: protectedProcedure.query(async ({ ctx }) => {
    ensureRole(ctx, "admin");
    const db = await getDb();
    if (!db) return { totalDevices: 0, onlineDevices: 0, activeCampaigns: 0, lowBattery: 0 };

    const allDevices = await db.select().from(devices);
    const recentTelemetry = await db
      .select()
      .from(deviceTelemetry)
      .orderBy(desc(deviceTelemetry.createdAt))
      .limit(allDevices.length);

    const onlineDevices = recentTelemetry.filter((t) => {
      const heartbeatTime = t.heartbeatAt ? new Date(t.heartbeatAt).getTime() : 0;
      const now = Date.now();
      return now - heartbeatTime < 5 * 60 * 1000; // 5 minutes
    }).length;

    const lowBattery = recentTelemetry.filter((t) => (t.batteryLevel || 0) < 20).length;

    const allocations = await db.select().from(campaignAllocations);
    const activeCampaigns = allocations.filter((a) => a.status === "active").length;

    return {
      totalDevices: allDevices.length,
      onlineDevices,
      activeCampaigns,
      lowBattery,
    };
  }),

  getDevices: protectedProcedure
    .input(
      z.object({
        status: z.enum(["online", "offline", "all"]).optional().default("all"),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db) return { devices: [], total: 0 };

      let query = db
        .select({
          device: devices,
          vehicle: vehicles,
          driver: driverProfiles,
        })
        .from(devices)
        .leftJoin(vehicles, eq(devices.vehicleId, vehicles.id))
        .leftJoin(driverProfiles, eq(vehicles.driverId, driverProfiles.id));

      const results = await query.limit(input.limit).offset(input.offset);

      // Get latest telemetry for each device
      const deviceIds = results.map((r) => r.device.id);
      const telemetryMap = new Map();

      if (deviceIds.length > 0) {
        const telemetry = await db
          .select()
          .from(deviceTelemetry)
          .where(eq(deviceTelemetry.deviceId, deviceIds[0]))
          .orderBy(desc(deviceTelemetry.createdAt))
          .limit(1);

        if (telemetry.length > 0) {
          telemetryMap.set(deviceIds[0], telemetry[0]);
        }
      }

      // Filter by status if needed
      let filtered = results;
      if (input.status !== "all") {
        filtered = results.filter((r) => {
          const telemetry = telemetryMap.get(r.device.id);
          if (!telemetry) return input.status === "offline";

          const heartbeatTime = telemetry.heartbeatAt ? new Date(telemetry.heartbeatAt).getTime() : 0;
          const now = Date.now();
          const isOnline = now - heartbeatTime < 5 * 60 * 1000;

          return input.status === "online" ? isOnline : !isOnline;
        });
      }

      return {
        devices: filtered.map((r) => ({
          ...r.device,
          vehicle: r.vehicle,
          driver: r.driver,
          telemetry: telemetryMap.get(r.device.id),
        })),
        total: results.length,
      };
    }),

  getDeviceTelemetry: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(deviceTelemetry)
        .where(eq(deviceTelemetry.deviceId, input.deviceId))
        .orderBy(desc(deviceTelemetry.createdAt))
        .limit(100);
    }),

  getDeviceDetail: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db) return null;

      const device = await db.select().from(devices).where(eq(devices.id, input.deviceId)).limit(1);
      if (!device[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Device not found" });

      const vehicle = device[0].vehicleId
        ? await db.select().from(vehicles).where(eq(vehicles.id, device[0].vehicleId)).limit(1)
        : [];

      const driver = vehicle[0]?.driverId
        ? await db.select().from(driverProfiles).where(eq(driverProfiles.id, vehicle[0].driverId)).limit(1)
        : [];

      const latestTelemetry = await db
        .select()
        .from(deviceTelemetry)
        .where(eq(deviceTelemetry.deviceId, input.deviceId))
        .orderBy(desc(deviceTelemetry.createdAt))
        .limit(1);

      const allocation = await db
        .select()
        .from(campaignAllocations)
        .where(eq(campaignAllocations.deviceId, input.deviceId))
        .orderBy(desc(campaignAllocations.createdAt))
        .limit(1);

      const campaign = allocation[0]?.campaignId
        ? await db.select().from(campaigns).where(eq(campaigns.id, allocation[0].campaignId)).limit(1)
        : [];

      return {
        device: device[0],
        vehicle: vehicle[0] || null,
        driver: driver[0] || null,
        telemetry: latestTelemetry[0] || null,
        currentAllocation: allocation[0] || null,
        currentCampaign: campaign[0] || null,
      };
    }),

  allocateCampaign: protectedProcedure
    .input(
      z.object({
        deviceId: z.number(),
        campaignId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const device = await db.select().from(devices).where(eq(devices.id, input.deviceId)).limit(1);
      if (!device[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found",
        });

      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1);
      if (!campaign[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });

      // Deactivate any existing active allocations for this device
      const existingAllocations = await db
        .select()
        .from(campaignAllocations)
        .where(and(eq(campaignAllocations.deviceId, input.deviceId), eq(campaignAllocations.status, "active")));

      if (existingAllocations.length > 0) {
      await db
        .update(campaignAllocations)
        .set({ status: "completed" })
        .where(eq(campaignAllocations.deviceId, input.deviceId));
      }

      // Create new allocation
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30); // 30-day allocation
      
      const result = await db.insert(campaignAllocations).values({
        deviceId: input.deviceId,
        campaignId: input.campaignId,
        status: "active",
        allocationStartDate: today,
        allocationEndDate: endDate,
      });

      await createAuditLog(
        ctx.user!.id,
        "campaign_allocated_to_device",
        "device",
        input.deviceId,
        { campaignId: input.campaignId },
        null
      );

      return { success: true, allocationId: result[0].insertId };
    }),

  deallocateCampaign: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const allocation = await db
        .select()
        .from(campaignAllocations)
        .where(and(eq(campaignAllocations.deviceId, input.deviceId), eq(campaignAllocations.status, "active")))
        .limit(1);

      if (!allocation[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active allocation found for this device",
        });

      await db
        .update(campaignAllocations)
        .set({ status: "completed" })
        .where(eq(campaignAllocations.id, allocation[0].id));

      await createAuditLog(
        ctx.user!.id,
        "campaign_deallocated_from_device",
        "device",
        input.deviceId,
        { allocationId: allocation[0].id },
        null
      );

      return { success: true };
    }),
});
