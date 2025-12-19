import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  getComplianceQueue,
  createAuditLog,
  getDb,
} from "../db";
import {
  complianceQueue,
  creatives,
  campaigns,
  supportTickets,
} from "../../drizzle/schema";

function ensureRole(ctx: any, role: string) {
  if (ctx.user?.role !== role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires ${role} role`,
    });
  }
}

export const adminRouter = router({
  getComplianceQueue: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      return getComplianceQueue(input?.status);
    }),

  getComplianceStats: protectedProcedure.query(async ({ ctx }) => {
    ensureRole(ctx, "admin");
    const db = await getDb();
    if (!db) return { pending: 0, approved: 0, rejected: 0 };
    const queue = await db.select().from(complianceQueue);
    return {
      pending: queue.filter((item) => item.status === "pending").length,
      approved: queue.filter((item) => item.status === "approved").length,
      rejected: queue.filter((item) => item.status === "rejected").length,
    };
  }),

  reviewCreative: protectedProcedure
    .input(
      z.object({
        complianceId: z.number(),
        creativeId: z.number(),
        approved: z.boolean(),
        rejectionReason: z.string().optional(),
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

      const creative = await db
        .select()
        .from(creatives)
        .where(eq(creatives.id, input.creativeId))
        .limit(1);
      if (!creative[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creative not found",
        });

      const newStatus = input.approved ? "approved" : "rejected";
      await db
        .update(creatives)
        .set({
          approvalStatus: newStatus,
          complianceApprovedAt: input.approved ? new Date() : null,
          complianceApprovedBy: input.approved ? ctx.user!.id : null,
          rejectionReason: input.rejectionReason,
        })
        .where(eq(creatives.id, input.creativeId));

      await db
        .update(complianceQueue)
        .set({ status: newStatus })
        .where(eq(complianceQueue.id, input.complianceId));

      await createAuditLog(
        ctx.user!.id,
        input.approved
          ? "creative_approved_by_admin"
          : "creative_rejected_by_admin",
        "creative",
        input.creativeId,
        { reason: input.rejectionReason },
        null
      );

      return { success: true };
    }),

  approveCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const campaign = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, input.campaignId))
        .limit(1);
      if (!campaign[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });

      await db
        .update(campaigns)
        .set({ status: "approved" })
        .where(eq(campaigns.id, input.campaignId));

      await createAuditLog(
        ctx.user!.id,
        "campaign_approved_by_admin",
        "campaign",
        input.campaignId,
        null,
        null
      );

      return { success: true };
    }),

  rejectCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ensureRole(ctx, "admin");
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const campaign = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, input.campaignId))
        .limit(1);
      if (!campaign[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });

      await db
        .update(campaigns)
        .set({ status: "cancelled" })
        .where(eq(campaigns.id, input.campaignId));

      await createAuditLog(
        ctx.user!.id,
        "campaign_rejected_by_admin",
        "campaign",
        input.campaignId,
        { reason: input.reason },
        null
      );

      return { success: true };
    }),

  getTickets: protectedProcedure.query(async ({ ctx }) => {
    ensureRole(ctx, "admin");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(supportTickets);
  }),
});
