import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { campaigns, clientProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createClientContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-client-openid",
    email: "client@test.com",
    name: "Test Client",
    loginMethod: "manus",
    role: "client",
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

describe("client.campaign procedures", () => {
  let testClientProfileId: number;
  let testUserId: number = 1;

  beforeEach(async () => {
    // Create a test client profile
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up any existing test data
    await db.delete(campaigns).where(eq(campaigns.clientId, testClientProfileId));
    await db.delete(clientProfiles).where(eq(clientProfiles.userId, testUserId));

    // Create fresh test client profile
    const profileResult = await db.insert(clientProfiles).values({
      userId: testUserId,
      companyName: "Test Company",
      kycStatus: "approved",
      walletBalance: 100000, // €1000.00
    });

    testClientProfileId = profileResult[0].insertId as number;
  });

  it("should create a campaign successfully", async () => {
    const { ctx } = createClientContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientApp.createCampaign({
      campaignName: "Test Campaign",
      description: "Test Description",
      city: "Riga",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      numberOfCars: 5,
      dailyBudget: 1000,
      totalBudget: 31000,
    });

    expect(result).toHaveProperty("campaignId");
    expect(typeof result.campaignId).toBe("number");

    // Verify campaign was created in database
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const createdCampaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, result.campaignId as number))
      .limit(1);

    expect(createdCampaign).toHaveLength(1);
    expect(createdCampaign[0]?.campaignName).toBe("Test Campaign");
    expect(createdCampaign[0]?.status).toBe("draft");
    expect(createdCampaign[0]?.city).toBe("Riga");
  });

  it("should retrieve client campaigns", async () => {
    const { ctx } = createClientContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Create a test campaign
    await caller.clientApp.createCampaign({
      campaignName: "Test Campaign 1",
      city: "Riga",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      numberOfCars: 3,
      dailyBudget: 500,
      totalBudget: 15500,
    });

    // Retrieve campaigns
    const campaigns = await caller.clientApp.getCampaigns();

    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBeGreaterThan(0);
    expect(campaigns[0]?.campaignName).toBe("Test Campaign 1");
  });

  it("should retrieve wallet balance", async () => {
    const { ctx } = createClientContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    const balance = await caller.clientApp.getWalletBalance();

    expect(typeof balance).toBe("number");
    expect(balance).toBe(100000); // Initial balance from beforeEach
  });

  it("should fail to create campaign without required fields", async () => {
    const { ctx } = createClientContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientApp.createCampaign({
        campaignName: "",
        city: "Riga",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        numberOfCars: 3,
        dailyBudget: 500,
        totalBudget: 15500,
      })
    ).rejects.toThrow();
  });

  it("should fail when non-client user tries to access client procedures", async () => {
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

    await expect(caller.clientApp.getCampaigns()).rejects.toThrow("This action requires client role");
  });
});
