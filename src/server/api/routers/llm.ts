import { eq } from "drizzle-orm"
import { z } from "zod"

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"
import { llmProviders } from "~/server/db/schema"

const providerEnum = z.enum(["azure", "openrouter"])

export const llmRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.llmProviders.findMany({
      orderBy: (fields, { asc }) => [asc(fields.provider)],
    }),
  ),

  upsertAzure: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        endpoint: z.string().url(),
        deploymentName: z.string().min(1),
        apiVersion: z.string().min(1).default("2024-02-15-preview"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(llmProviders)
        .values({
          provider: "azure",
          apiKey: input.apiKey,
          azureEndpoint: input.endpoint,
          azureDeploymentName: input.deploymentName,
          azureApiVersion: input.apiVersion,
        })
        .onConflictDoUpdate({
          target: llmProviders.provider,
          set: {
            apiKey: input.apiKey,
            azureEndpoint: input.endpoint,
            azureDeploymentName: input.deploymentName,
            azureApiVersion: input.apiVersion,
          },
        })

      return ctx.db.query.llmProviders.findFirst({
        where: eq(llmProviders.provider, "azure"),
      })
    }),

  upsertOpenRouter: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        baseUrl: z.string().url().optional(),
        model: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(llmProviders)
        .values({
          provider: "openrouter",
          apiKey: input.apiKey,
          baseUrl: input.baseUrl ?? "https://openrouter.ai/api/v1",
          model: input.model,
        })
        .onConflictDoUpdate({
          target: llmProviders.provider,
          set: {
            apiKey: input.apiKey,
            baseUrl: input.baseUrl ?? "https://openrouter.ai/api/v1",
            model: input.model,
          },
        })

      return ctx.db.query.llmProviders.findFirst({
        where: eq(llmProviders.provider, "openrouter"),
      })
    }),

  setActive: publicProcedure
    .input(
      z.object({
        provider: providerEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx.update(llmProviders).set({ isActive: false })
        await tx
          .update(llmProviders)
          .set({ isActive: true })
          .where(eq(llmProviders.provider, input.provider))
      })

      return ctx.db.query.llmProviders.findMany({
        orderBy: (fields, { asc }) => [asc(fields.provider)],
      })
    }),
})

