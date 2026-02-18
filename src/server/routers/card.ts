import { TRPCError } from "@trpc/server";
import { z } from "zod";

import * as cardRepo from "~/db/repository/card.repo";
import * as labelRepo from "~/db/repository/label.repo";
import * as listRepo from "~/db/repository/list.repo";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const cardRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({
      openapi: {
        summary: "Create a card",
        method: "POST",
        path: "/cards",
        description: "Creates a new card for a given list",
        tags: ["Cards"],
        protect: true,
      },
    })
    .input(
      z.object({
        title: z.string().min(1).max(2000),
        description: z.string().max(10000),
        listPublicId: z.string().min(12),
        labelPublicIds: z.array(z.string().min(12)),
        position: z.enum(["start", "end"]),
        dueDate: z.date().nullable().optional(),
      }),
    )
    .output(z.custom<Awaited<ReturnType<typeof cardRepo.create>>>())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const list = await listRepo.getListIdByPublicId(
        ctx.db,
        input.listPublicId,
      );

      if (!list)
        throw new TRPCError({
          message: `List with public ID ${input.listPublicId} not found`,
          code: "NOT_FOUND",
        });

      const newCard = await cardRepo.create(ctx.db, {
        title: input.title,
        description: input.description,
        createdBy: userId,
        listId: list.id,
        position: input.position,
        dueDate: input.dueDate ?? null,
      });

      const newCardId = newCard.id;

      if (!newCardId)
        throw new TRPCError({
          message: `Failed to create card`,
          code: "INTERNAL_SERVER_ERROR",
        });

      if (newCardId && input.labelPublicIds.length) {
        const labels = await labelRepo.getAllByPublicIds(
          ctx.db,
          input.labelPublicIds,
        );

        if (!labels.length)
          throw new TRPCError({
            message: `Labels with public IDs (${input.labelPublicIds.join(", ")}) not found`,
            code: "NOT_FOUND",
          });

        const labelsInsert = labels.map((label) => ({
          cardId: newCardId,
          labelId: label.id,
        }));

        const cardLabels = await cardRepo.bulkCreateCardLabelRelationships(
          ctx.db,
          labelsInsert,
        );

        if (!cardLabels.length)
          throw new TRPCError({
            message: `Failed to create card label relationships`,
            code: "INTERNAL_SERVER_ERROR",
          });
      }

      return newCard;
    }),
  addOrRemoveLabel: protectedProcedure
    .meta({
      openapi: {
        summary: "Add or remove a label from a card",
        method: "PUT",
        path: "/cards/{cardPublicId}/labels/{labelPublicId}",
        description: "Adds or removes a label from a card",
        tags: ["Cards"],
        protect: true,
      },
    })
    .input(
      z.object({
        cardPublicId: z.string().min(12),
        labelPublicId: z.string().min(12),
      }),
    )
    .output(z.object({ newLabel: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const card = await cardRepo.getCardIdByPublicId(
        ctx.db,
        input.cardPublicId,
      );

      if (!card)
        throw new TRPCError({
          message: `Card with public ID ${input.cardPublicId} not found`,
          code: "NOT_FOUND",
        });

      const label = await labelRepo.getByPublicId(ctx.db, input.labelPublicId);

      if (!label)
        throw new TRPCError({
          message: `Label with public ID ${input.labelPublicId} not found`,
          code: "NOT_FOUND",
        });

      const cardLabelIds = { cardId: card.id, labelId: label.id };

      const existingLabel = await cardRepo.getCardLabelRelationship(
        ctx.db,
        cardLabelIds,
      );

      if (existingLabel) {
        const deletedCardLabelRelationship =
          await cardRepo.hardDeleteCardLabelRelationship(ctx.db, cardLabelIds);

        if (!deletedCardLabelRelationship)
          throw new TRPCError({
            message: `Failed to remove label from card`,
            code: "INTERNAL_SERVER_ERROR",
          });

        return { newLabel: false };
      }

      const newCardLabelRelationship =
        await cardRepo.createCardLabelRelationship(ctx.db, cardLabelIds);

      if (!newCardLabelRelationship)
        throw new TRPCError({
          message: `Failed to add label to card`,
          code: "INTERNAL_SERVER_ERROR",
        });

      return { newLabel: true };
    }),
  byId: publicProcedure
    .meta({
      openapi: {
        summary: "Get a card by public ID",
        method: "GET",
        path: "/cards/{cardPublicId}",
        description: "Retrieves a card by its public ID",
        tags: ["Cards"],
      },
    })
    .input(z.object({ cardPublicId: z.string().min(12) }))
    .output(
      z.custom<
        NonNullable<
          Awaited<ReturnType<typeof cardRepo.getWithListAndMembersByPublicId>>
        >
      >(),
    )
    .query(async ({ ctx, input }) => {
      const card = await cardRepo.getCardIdByPublicId(
        ctx.db,
        input.cardPublicId,
      );

      if (!card)
        throw new TRPCError({
          message: `Card with public ID ${input.cardPublicId} not found`,
          code: "NOT_FOUND",
        });

      if (card.boardVisibility === "private") {
        const userId = ctx.user?.id;

        if (!userId)
          throw new TRPCError({
            message: `User not authenticated`,
            code: "UNAUTHORIZED",
          });
      }

      const result = await cardRepo.getWithListAndMembersByPublicId(
        ctx.db,
        input.cardPublicId,
      );

      if (!result)
        throw new TRPCError({
          message: `Card with public ID ${input.cardPublicId} not found`,
          code: "NOT_FOUND",
        });

      return result;
    }),
  update: protectedProcedure
    .meta({
      openapi: {
        summary: "Update a card",
        method: "PUT",
        path: "/cards/{cardPublicId}",
        description: "Updates a card by its public ID",
        tags: ["Cards"],
        protect: true,
      },
    })
    .input(
      z.object({
        cardPublicId: z.string().min(12),
        title: z.string().min(1).max(2000).optional(),
        description: z.string().optional(),
        index: z.number().optional(),
        listPublicId: z.string().min(12).optional(),
        dueDate: z.date().nullable().optional(),
      }),
    )
    .output(z.custom<Awaited<ReturnType<typeof cardRepo.update>>>())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const card = await cardRepo.getCardIdByPublicId(
        ctx.db,
        input.cardPublicId,
      );

      if (!card)
        throw new TRPCError({
          message: `Card with public ID ${input.cardPublicId} not found`,
          code: "NOT_FOUND",
        });

      const existingCard = await cardRepo.getByPublicId(
        ctx.db,
        input.cardPublicId,
      );

      let newListId: number | undefined;

      if (input.listPublicId) {
        const newList = await listRepo.getByPublicId(
          ctx.db,
          input.listPublicId,
        );

        if (!newList)
          throw new TRPCError({
            message: `List with public ID ${input.listPublicId} not found`,
            code: "NOT_FOUND",
          });

        newListId = newList.id;
      }

      if (!existingCard) {
        throw new TRPCError({
          message: `Card with public ID ${input.cardPublicId} not found`,
          code: "NOT_FOUND",
        });
      }

      let result:
        | {
            id: number;
            title: string;
            description: string | null;
            publicId: string;
            dueDate: Date | null;
          }
        | undefined;

      if (input.title || input.description || input.dueDate !== undefined) {
        result = await cardRepo.update(
          ctx.db,
          {
            ...(input.title && { title: input.title }),
            ...(input.description && { description: input.description }),
            ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
          },
          { cardPublicId: input.cardPublicId },
        );
      }

      if (input.index !== undefined) {
        result = await cardRepo.reorder(ctx.db, {
          cardId: existingCard.id,
          newIndex: input.index,
          newListId: newListId,
        });
      }

      if (!result)
        throw new TRPCError({
          message: `Failed to update card`,
          code: "INTERNAL_SERVER_ERROR",
        });

      return result;
    }),
  delete: protectedProcedure
    .meta({
      openapi: {
        summary: "Delete a card",
        method: "DELETE",
        path: "/cards/{cardPublicId}",
        description: "Deletes a card by its public ID",
        tags: ["Cards"],
        protect: true,
      },
    })
    .input(
      z.object({
        cardPublicId: z.string().min(12),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const card = await cardRepo.getCardIdByPublicId(
        ctx.db,
        input.cardPublicId,
      );

      if (!card)
        throw new TRPCError({
          message: `Card with public ID ${input.cardPublicId} not found`,
          code: "NOT_FOUND",
        });

      const deletedAt = new Date();

      await cardRepo.softDelete(ctx.db, {
        cardId: card.id,
        deletedAt,
        deletedBy: userId,
      });

      return { success: true };
    }),
});
