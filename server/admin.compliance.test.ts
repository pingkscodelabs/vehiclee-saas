import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { campaigns, clientProfiles, creatives, complianceQueue } from "../drizzle/schema";
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

describe("admin.compliance procedures", () => {
  let testCampaignId: number;
  let testCreativeId: number;
  let testComplianceQueueId: number;
  let testClientProfileId: number;
  let testCounter = 0;

  beforeEach(async () => {
    testCounter++;
    const timestamp = Math.floor(Date.now() / 1000) + testCounter;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(creatives).where(eq(creatives.campaignId, testCampaignId || 0));
    await db.delete(complianceQueue).where(eq(complianceQueue.id, testComplianceQueueId || 0));
    await db.delete(campaigns).where(eq(campaigns.id, testCampaignId || 0));
    await db.delete(clientProfiles).where(eq(clientProfiles.id, testClientProfileId || 0));

    // Create test client profile with unique userId
    const profileResult = await db.insert(clientProfiles).values({
      userId: timestamp,
      companyName: "Test Company",
      companyCountry: "NL",
      walletBalance: 100000,
    });
    testClientProfileId = profileResult[0].insertId as number;

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
      status: "awaiting_approval",
    });
    testCampaignId = campaignResult[0].insertId as number;

    // Create test creative
    const creativeResult = await db.insert(creatives).values({
      campaignId: testCampaignId,
      assetUrl: "https://example.com/creative.jpg",
      assetKey: "test-creative-key",
      creativeType: "custom",
      approvalStatus: "pending",
    });
    testCreativeId = creativeResult[0].insertId as number;

    // Create compliance queue entry
    const queueResult = await db.insert(complianceQueue).values({
      entityType: "creative",
      entityId: testCreativeId,
      status: "pending",
    });
    testComplianceQueueId = queueResult[0].insertId as number;
  });

  it("should retrieve compliance stats", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.adminApp.getComplianceStats();

    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("approved");
    expect(stats).toHaveProperty("rejected");
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.approved).toBe("number");
    expect(typeof stats.rejected).toBe("number");
  });

  it("should retrieve compliance queue", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const queue = await caller.adminApp.getComplianceQueue();

    expect(Array.isArray(queue)).toBe(true);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0]?.entityType).toBe("creative");
  });

  it("should approve a creative", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminApp.reviewCreative({
      complianceId: testComplianceQueueId,
      creativeId: testCreativeId,
      approved: true,
    });

    expect(result.success).toBe(true);

    // Verify creative was approved
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedCreative = await db.select().from(creatives).where(eq(creatives.id, testCreativeId)).limit(1);
    expect(updatedCreative[0]?.approvalStatus).toBe("approved");
    expect(updatedCreative[0]?.complianceApprovedAt).not.toBeNull();
    expect(updatedCreative[0]?.complianceApprovedBy).toBe(1);
  });

  it("should reject a creative with reason", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const rejectionReason = "Image quality too low";
    const result = await caller.adminApp.reviewCreative({
      complianceId: testComplianceQueueId,
      creativeId: testCreativeId,
      approved: false,
      rejectionReason,
    });

    expect(result.success).toBe(true);

    // Verify creative was rejected
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedCreative = await db.select().from(creatives).where(eq(creatives.id, testCreativeId)).limit(1);
    expect(updatedCreative[0]?.approvalStatus).toBe("rejected");
    expect(updatedCreative[0]?.rejectionReason).toBe(rejectionReason);
  });

  it("should approve a campaign", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminApp.approveCampaign({
      campaignId: testCampaignId,
    });

    expect(result.success).toBe(true);

    // Verify campaign was approved
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedCampaign = await db.select().from(campaigns).where(eq(campaigns.id, testCampaignId)).limit(1);
    expect(updatedCampaign[0]?.status).toBe("approved");
  });

  it("should reject a campaign", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const reason = "Campaign violates brand guidelines";
    const result = await caller.adminApp.rejectCampaign({
      campaignId: testCampaignId,
      reason,
    });

    expect(result.success).toBe(true);

    // Verify campaign was cancelled
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedCampaign = await db.select().from(campaigns).where(eq(campaigns.id, testCampaignId)).limit(1);
    expect(updatedCampaign[0]?.status).toBe("cancelled");
  });

  it("should fail when non-admin user tries to access admin procedures", async () => {
    const user: AuthenticatedUser = {
      id: 999,
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
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(caller.adminApp.getComplianceStats()).rejects.toThrow("This action requires admin role");
  });
});
