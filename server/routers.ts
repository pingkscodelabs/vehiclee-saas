import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
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

    getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "client");
      const profile = await getClientProfile(ctx.user!.id);
      if (!profile) return 0;
      return getWalletBalance(profile.id);
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

  adminApp: router({
    getComplianceQueue: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        ensureRole(ctx, "admin");
        return getComplianceQueue(input?.status);
      }),

    getTickets: protectedProcedure.query(async ({ ctx }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(supportTickets);
    }),
  }),
});

export type AppRouter = typeof appRouter;
