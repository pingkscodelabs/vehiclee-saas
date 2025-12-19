import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import {
  devices,
  vehicles,
  driverProfiles,
  campaigns,
  clientProfiles,
  deviceTelemetry,
  campaignAllocations,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-admin-openid",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("fleet.management procedures", () => {
  let testDeviceId: number;
  let testVehicleId: number;
  let testDriverId: number;
  let testCampaignId: number;
  let testClientProfileId: number;

  beforeEach(async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data from previous runs
    if (testDeviceId) {
      await db.delete(campaignAllocations).where(eq(campaignAllocations.deviceId, testDeviceId));
      await db.delete(deviceTelemetry).where(eq(deviceTelemetry.deviceId, testDeviceId));
      await db.delete(devices).where(eq(devices.id, testDeviceId));
    }
    if (testVehicleId) {
      await db.delete(vehicles).where(eq(vehicles.id, testVehicleId));
    }
    if (testDriverId) {
      await db.delete(driverProfiles).where(eq(driverProfiles.id, testDriverId));
    }
    if (testCampaignId) {
      await db.delete(campaigns).where(eq(campaigns.id, testCampaignId));
    }
    if (testClientProfileId) {
      await db.delete(clientProfiles).where(eq(clientProfiles.id, testClientProfileId));
    }

    // Create test client profile with unique userId using timestamp
    const clientResult = await db.insert(clientProfiles).values({
      userId: timestamp,
      companyName: "Test Company",
      companyCountry: "NL",
      walletBalance: 100000,
    });
    testClientProfileId = clientResult[0].insertId as number;

    // Create test campaign
    const campaignResult = await db.insert(campaigns).values({
      clientId: testClientProfileId,
      campaignName: "Test Campaign",
      city: "Riga",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      numberOfCars: 5,
      dailyBudget: 1000,
      totalBudget: 31000,
      status: "approved",
    });
    testCampaignId = campaignResult[0].insertId as number;

    // Create test driver with unique userId using timestamp
    const driverResult = await db.insert(driverProfiles).values({
      userId: timestamp + 100000,
      licenseNumber: `DL${timestamp}`,
      documentStatus: "approved",
    });
    testDriverId = driverResult[0].insertId as number;

    // Create test vehicle
    const vehicleResult = await db.insert(vehicles).values({
      driverId: testDriverId,
      licensePlate: `TEST${timestamp}`,
      vin: `VIN${timestamp}`,
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      registrationStatus: "approved",
    });
    testVehicleId = vehicleResult[0].insertId as number;

    // Create test device
    const deviceResult = await db.insert(devices).values({
      vehicleId: testVehicleId,
      deviceId: `DEV${timestamp}`,
      deviceSecret: `SECRET${timestamp}`,
      model: "E-Paper Display Pro",
      resolution: "1200x825",
      colorMode: "bw",
      status: "active",
    });
    testDeviceId = deviceResult[0].insertId as number;

    // Create device telemetry
    await db.insert(deviceTelemetry).values({
      deviceId: testDeviceId,
      heartbeatAt: new Date(),
      batteryLevel: 85,
      signalStrength: 90,
      uptime: 86400,
      contentHash: `HASH${timestamp}`,
    });
  });

  it("should retrieve fleet overview", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const overview = await caller.fleetApp.getFleetOverview();

    expect(overview).toHaveProperty("totalDevices");
    expect(overview).toHaveProperty("onlineDevices");
    expect(overview).toHaveProperty("activeCampaigns");
    expect(overview).toHaveProperty("lowBattery");
    expect(typeof overview.totalDevices).toBe("number");
    expect(overview.totalDevices).toBeGreaterThan(0);
  });

  it("should retrieve devices list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fleetApp.getDevices({ status: "all" });

    expect(result).toHaveProperty("devices");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.devices)).toBe(true);
    expect(result.devices.length).toBeGreaterThan(0);
  });

  it("should retrieve device telemetry", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const telemetry = await caller.fleetApp.getDeviceTelemetry({ deviceId: testDeviceId });

    expect(Array.isArray(telemetry)).toBe(true);
    expect(telemetry.length).toBeGreaterThan(0);
    expect(telemetry[0]?.batteryLevel).toBe(85);
    expect(telemetry[0]?.signalStrength).toBe(90);
  });

  it("should retrieve device detail", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const detail = await caller.fleetApp.getDeviceDetail({ deviceId: testDeviceId });

    expect(detail).not.toBeNull();
    expect(detail?.device.id).toBe(testDeviceId);
    expect(detail?.vehicle?.licensePlate).toContain("TEST");
    expect(detail?.telemetry?.batteryLevel).toBe(85);
    expect(detail?.device.deviceId).toContain("DEV");
  });

  it("should allocate campaign to device", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fleetApp.allocateCampaign({
      deviceId: testDeviceId,
      campaignId: testCampaignId,
    });

    expect(result.success).toBe(true);
    expect(result.allocationId).toBeDefined();

    // Verify allocation was created
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allocation = await db
      .select()
      .from(campaignAllocations)
      .where(eq(campaignAllocations.deviceId, testDeviceId))
      .limit(1);

    expect(allocation[0]?.status).toBe("active");
    expect(allocation[0]?.campaignId).toBe(testCampaignId);
  });

  it("should deallocate campaign from device", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First allocate
    await caller.fleetApp.allocateCampaign({
      deviceId: testDeviceId,
      campaignId: testCampaignId,
    });

    // Then deallocate
    const result = await caller.fleetApp.deallocateCampaign({
      deviceId: testDeviceId,
    });

    expect(result.success).toBe(true);

    // Verify allocation was completed
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allocation = await db
      .select()
      .from(campaignAllocations)
      .where(eq(campaignAllocations.deviceId, testDeviceId))
      .limit(1);

    expect(allocation[0]?.status).toBe("completed");
  });

  it("should fail when non-admin user tries to access fleet procedures", async () => {
    const user: AuthenticatedUser = {
      id: 999,
      openId: "test-driver-openid",
      email: "driver@test.com",
      name: "Test Driver",
      loginMethod: "manus",
      role: "driver",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx: TrpcContext = {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(caller.fleetApp.getFleetOverview()).rejects.toThrow("This action requires admin role");
  });

  it("should fail to allocate non-existent campaign", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.fleetApp.allocateCampaign({
        deviceId: testDeviceId,
        campaignId: 99999,
      })
    ).rejects.toThrow();
  });

  it("should fail to deallocate when no allocation exists", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.fleetApp.deallocateCampaign({
        deviceId: testDeviceId,
      })
    ).rejects.toThrow();
  });
});
