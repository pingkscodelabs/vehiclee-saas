import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { adminRouter } from "./routers/admin";
import {
  getClientProfile,
  getClientCampaigns,
  getWalletBalance,
  getDriverProfile,
  getDriverVehicles,
  getDeviceByVehicle,
  getDeviceStatus,
  getComplianceQueue,
  getDriverPayouts,
  getUserTickets,
  createAuditLog,
  getDb,
  getUserById,
} from "./db";
import { TRPCError } from "@trpc/server";
import {
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
} from "../drizzle/schema";

function ensureRole(ctx: any, role: string) {
  if (ctx.user?.role !== role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires ${role} role`,
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  clientApp: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "client");
      const profile = await getClientProfile(ctx.user!.id);
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }
      return profile;
    }),

    getCampaigns: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "client");
      const profile = await getClientProfile(ctx.user!.id);
      if (!profile) return [];
      return getClientCampaigns(profile.id);
    }),

    getCampaignDetail: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ ctx, input }) => {
        ensureRole(ctx, "client");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const campaign = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1);
        if (!campaign[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });

        const profile = await getClientProfile(ctx.user!.id);
        if (!profile || campaign[0].clientId !== profile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        const campaignCreatives = await db.select().from(creatives).where(eq(creatives.campaignId, input.campaignId));
        return { ...campaign[0], creatives: campaignCreatives };
      }),

    getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "client");
      const profile = await getClientProfile(ctx.user!.id);
      if (!profile) return 0;
      return getWalletBalance(profile.id);
    }),

    createCampaign: protectedProcedure
      .input(
        z.object({
          campaignName: z.string().min(1),
          description: z.string().optional(),
          city: z.string().min(1),
          zoneId: z.number().optional(),
          startDate: z.string(),
          endDate: z.string(),
          numberOfCars: z.number().int().positive(),
          dailyBudget: z.number().int().positive(),
          totalBudget: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        ensureRole(ctx, "client");
        const profile = await getClientProfile(ctx.user!.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Client profile not found" });

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const result = await db.insert(campaigns).values({
          clientId: profile.id,
          campaignName: input.campaignName,
          description: input.description,
          city: input.city,
          zoneId: input.zoneId,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          numberOfCars: input.numberOfCars,
          dailyBudget: input.dailyBudget,
          totalBudget: input.totalBudget,
          status: "draft",
        });

        await createAuditLog(
          ctx.user!.id,
          "campaign_created",
          "campaign",
          result[0].insertId as any,
          { campaignName: input.campaignName },
          null
        );

        return { campaignId: result[0].insertId };
      }),

    uploadAsset: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          fileName: z.string(),
          fileData: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        ensureRole(ctx, "client");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const campaign = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1);
        if (!campaign[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });

        const profile = await getClientProfile(ctx.user!.id);
        if (!profile || campaign[0].clientId !== profile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        const { storagePut } = await import("./storage.js");
        const buffer = Buffer.from(input.fileData, "base64");
        const randomSuffix = Math.random().toString(36).substring(7);
        const assetKey = `campaigns/${input.campaignId}/${input.fileName}-${randomSuffix}`;
        
        const { url } = await storagePut(assetKey, buffer, input.mimeType);

        const creativeResult = await db.insert(creatives).values({
          campaignId: input.campaignId,
          assetUrl: url,
          assetKey,
          creativeType: "custom",
          approvalStatus: "pending",
        });

        await db.update(campaigns).set({ status: "awaiting_creative" }).where(eq(campaigns.id, input.campaignId));

        return { creativeId: creativeResult[0].insertId, assetUrl: url };
      }),

    submitCreative: protectedProcedure
      .input(z.object({ campaignId: z.number(), creativeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        ensureRole(ctx, "client");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const campaign = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1);
        if (!campaign[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });

        const profile = await getClientProfile(ctx.user!.id);
        if (!profile || campaign[0].clientId !== profile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.update(campaigns).set({ status: "awaiting_approval" }).where(eq(campaigns.id, input.campaignId));

        await db.insert(complianceQueue).values({
          entityType: "creative",
          entityId: input.creativeId,
          status: "pending",
        });

        await createAuditLog(
          ctx.user!.id,
          "creative_submitted",
          "creative",
          input.creativeId,
          { campaignId: input.campaignId },
          null
        );

        return { success: true };
      }),

    approveCreative: protectedProcedure
      .input(z.object({ creativeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        ensureRole(ctx, "client");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const creative = await db.select().from(creatives).where(eq(creatives.id, input.creativeId)).limit(1);
        if (!creative[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Creative not found" });

        await db.update(creatives).set({ clientApprovedAt: new Date() }).where(eq(creatives.id, input.creativeId));

        await createAuditLog(
          ctx.user!.id,
          "creative_approved_by_client",
          "creative",
          input.creativeId,
          null,
          null
        );

        return { success: true };
      }),
  }),

  driverApp: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "driver");
      const profile = await getDriverProfile(ctx.user!.id);
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found",
        });
      }
      return profile;
    }),

    getVehicles: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "driver");
      const profile = await getDriverProfile(ctx.user!.id);
      if (!profile) return [];
      return getDriverVehicles(profile.id);
    }),

    getEarnings: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "driver");
      const profile = await getDriverProfile(ctx.user!.id);
      if (!profile) return [];
      return getDriverPayouts(profile.id);
    }),

    getTickets: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "driver");
      return getUserTickets(ctx.user!.id);
    }),
  }),

  adminApp: adminRouter,
});

export type AppRouter = typeof appRouter;
