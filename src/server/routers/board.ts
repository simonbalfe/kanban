import { TRPCError } from "@trpc/server";
import { z } from "zod";

import * as boardRepo from "~/db/repository/board.repo";
import * as cardRepo from "~/db/repository/card.repo";
import * as labelRepo from "~/db/repository/label.repo";
import * as listRepo from "~/db/repository/list.repo";
import { colours } from "~/lib/shared/constants";
import {
  convertDueDateFiltersToRanges,
  generateSlug,
  generateUID,
} from "~/lib/shared/utils";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const boardRouter = createTRPCRouter({
  all: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/boards",
        summary: "Get all boards",
        description: "Retrieves all boards for the current user",
        tags: ["Boards"],
        protect: true,
      },
    })
    .input(
      z.object({
        type: z.enum(["regular", "template"]).optional(),
      }),
    )
    .output(
      z.custom<Awaited<ReturnType<typeof boardRepo.getAllByUserId>>>(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const result = boardRepo.getAllByUserId(
        ctx.db,
        userId,
        { type: input.type }
      );

      return result;
    }),
  byId: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/boards/{boardPublicId}",
        summary: "Get board by public ID",
        description: "Retrieves a board by its public ID",
        tags: ["Boards"],
        protect: true,
      },
    })
    .input(
      z.object({
        boardPublicId: z.string().min(12),
        members: z.array(z.string().min(12)).optional(),
        labels: z.array(z.string().min(12)).optional(),
        lists: z.array(z.string().min(12)).optional(),
        dueDateFilters: z
          .array(
            z.enum([
              "overdue",
              "today",
              "tomorrow",
              "next-week",
              "next-month",
              "no-due-date",
            ]),
          )
          .optional(),
        type: z.enum(["regular", "template"]).optional(),
      }),
    )
    .output(z.custom<Awaited<ReturnType<typeof boardRepo.getByPublicId>>>())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const board = await boardRepo.getBoardIdByPublicId(
        ctx.db,
        input.boardPublicId,
      );

      if (!board)
        throw new TRPCError({
          message: `Board with public ID ${input.boardPublicId} not found`,
          code: "NOT_FOUND",
        });

      const dueDateFilters = input.dueDateFilters
        ? convertDueDateFiltersToRanges(input.dueDateFilters)
        : [];

      const result = await boardRepo.getByPublicId(
        ctx.db,
        input.boardPublicId,
        userId,
        {
          members: input.members ?? [],
          labels: input.labels ?? [],
          lists: input.lists ?? [],
          dueDate: dueDateFilters,
          type: input.type,
        },
      );

      if (!result) {
        throw new TRPCError({
          message: `Board with public ID ${input.boardPublicId} not found`,
          code: "NOT_FOUND",
        });
      }

      return {
        ...result,
        lists: result.lists,
      };
    }),
  bySlug: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/boards/by-slug/{boardSlug}",
        summary: "Get board by slug",
        description: "Retrieves a board by its slug",
        tags: ["Boards"],
        protect: false,
      },
    })
    .input(
      z.object({
        boardSlug: z
          .string()
          .min(3)
          .max(24)
          .regex(/^(?![-]+$)[a-zA-Z0-9-]+$/),
        members: z.array(z.string().min(12)).optional(),
        labels: z.array(z.string().min(12)).optional(),
        lists: z.array(z.string().min(12)).optional(),
        dueDateFilters: z
          .array(
            z.enum([
              "overdue",
              "today",
              "tomorrow",
              "next-week",
              "next-month",
              "no-due-date",
            ]),
          )
          .optional(),
      }),
    )
    .output(z.custom<Awaited<ReturnType<typeof boardRepo.getBySlug>>>())
    .query(async ({ ctx, input }) => {
      const dueDateFilters = input.dueDateFilters
        ? convertDueDateFiltersToRanges(input.dueDateFilters)
        : [];

      const result = await boardRepo.getBySlug(
        ctx.db,
        input.boardSlug,
        {
          members: input.members ?? [],
          labels: input.labels ?? [],
          lists: input.lists ?? [],
          dueDate: dueDateFilters,
        },
      );

      return result;
    }),
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/boards",
        summary: "Create board",
        description: "Creates a new board",
        tags: ["Boards"],
        protect: true,
      },
    })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        lists: z.array(z.string().min(1)),
        labels: z.array(z.string().min(1)),
        type: z.enum(["regular", "template"]).optional(),
        sourceBoardPublicId: z.string().min(12).optional(),
      }),
    )
    .output(z.custom<Awaited<ReturnType<typeof boardRepo.create>>>())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      if (input.sourceBoardPublicId) {
        const sourceBoardInfo = await boardRepo.getIdByPublicId(
          ctx.db,
          input.sourceBoardPublicId,
        );

        if (!sourceBoardInfo)
          throw new TRPCError({
            message: `Source board with public ID ${input.sourceBoardPublicId} not found`,
            code: "NOT_FOUND",
          });

        const sourceBoard = await boardRepo.getByPublicId(
          ctx.db,
          input.sourceBoardPublicId,
          userId,
          {
            members: [],
            labels: [],
            lists: [],
            dueDate: [],
            type: sourceBoardInfo.type,
          },
        );

        if (!sourceBoard)
          throw new TRPCError({
            message: `Source board with public ID ${input.sourceBoardPublicId} not found`,
            code: "NOT_FOUND",
          });

        let slug = generateSlug(input.name);

        const isSlugUnique = await boardRepo.isSlugUnique(ctx.db, { slug });

        if (!isSlugUnique || input.type === "template")
          slug = `${slug}-${generateUID()}`;

        const result = await boardRepo.createFromSnapshot(ctx.db, {
          source: sourceBoard,
          createdBy: userId,
          slug,
          name: input.name,
          type: input.type ?? "regular",
          sourceBoardId: sourceBoardInfo.id,
        });

        return result;
      }

      let slug = generateSlug(input.name);

      const isSlugUnique = await boardRepo.isSlugUnique(ctx.db, { slug });

      if (!isSlugUnique || input.type === "template")
        slug = `${slug}-${generateUID()}`;

      const result = await boardRepo.create(ctx.db, {
        publicId: generateUID(),
        slug,
        name: input.name,
        createdBy: userId,
        type: input.type,
      });

      if (!result)
        throw new TRPCError({
          message: `Failed to create board`,
          code: "INTERNAL_SERVER_ERROR",
        });

      if (input.lists.length) {
        const listInputs = input.lists.map((list, index) => ({
          publicId: generateUID(),
          name: list,
          boardId: result.id,
          createdBy: userId,
          index,
        }));

        await listRepo.bulkCreate(ctx.db, listInputs);
      }

      if (input.labels.length) {
        const labelInputs = input.labels.map((label, index) => ({
          publicId: generateUID(),
          name: label,
          boardId: result.id,
          createdBy: userId,
          colourCode: colours[index % colours.length]?.code ?? "#0d9488",
        }));

        await labelRepo.bulkCreate(ctx.db, labelInputs);
      }

      return result;
    }),
  update: protectedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: "/boards/{boardPublicId}",
        summary: "Update board",
        description: "Updates a board by its public ID",
        tags: ["Boards"],
        protect: true,
      },
    })
    .input(
      z.object({
        boardPublicId: z.string().min(12),
        name: z.string().min(1).optional(),
        slug: z
          .string()
          .min(3)
          .max(60)
          .regex(/^(?![-]+$)[a-zA-Z0-9-]+$/)
          .optional(),
        visibility: z.enum(["public", "private"]).optional(),
      }),
    )
    .output(z.custom<Awaited<ReturnType<typeof boardRepo.update>>>())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const board = await boardRepo.getBoardIdByPublicId(
        ctx.db,
        input.boardPublicId,
      );

      if (!board)
        throw new TRPCError({
          message: `Board with public ID ${input.boardPublicId} not found`,
          code: "NOT_FOUND",
        });

      if (input.slug) {
        const isBoardSlugAvailable = await boardRepo.isBoardSlugAvailable(
          ctx.db,
          input.slug,
        );

        if (!isBoardSlugAvailable) {
          throw new TRPCError({
            message: `Board slug ${input.slug} is not available`,
            code: "BAD_REQUEST",
          });
        }
      }

      const result = await boardRepo.update(ctx.db, {
        name: input.name,
        slug: input.slug,
        boardPublicId: input.boardPublicId,
        visibility: input.visibility,
      });

      if (!result)
        throw new TRPCError({
          message: `Failed to update board`,
          code: "INTERNAL_SERVER_ERROR",
        });

      return result;
    }),
  delete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/boards/{boardPublicId}",
        summary: "Delete board",
        description: "Deletes a board by its public ID",
        tags: ["Boards"],
        protect: true,
      },
    })
    .input(
      z.object({
        boardPublicId: z.string().min(12),
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

      const board = await boardRepo.getWithListIdsByPublicId(
        ctx.db,
        input.boardPublicId,
      );

      if (!board)
        throw new TRPCError({
          message: `Board with public ID ${input.boardPublicId} not found`,
          code: "NOT_FOUND",
        });

      const listIds = board.lists.map((list) => list.id);

      const deletedAt = new Date();

      await boardRepo.softDelete(ctx.db, {
        boardId: board.id,
        deletedAt,
        deletedBy: userId,
      });

      if (listIds.length) {
        const deletedLists = await listRepo.softDeleteAllByBoardId(ctx.db, {
          boardId: board.id,
          deletedAt,
          deletedBy: userId,
        });

        if (!Array.isArray(deletedLists)) {
          throw new TRPCError({
            message: `Failed to delete lists`,
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        await cardRepo.softDeleteAllByListIds(ctx.db, {
          listIds,
          deletedAt,
          deletedBy: userId,
        });
      }

      return { success: true };
    }),
  checkSlugAvailability: publicProcedure
    .meta({
      openapi: {
        summary: "Check if a board slug is available",
        method: "GET",
        path: "/boards/{boardPublicId}/check-slug-availability",
        description: "Checks if a board slug is available",
        tags: ["Boards"],
        protect: true,
      },
    })
    .input(
      z.object({
        boardSlug: z
          .string()
          .min(3)
          .max(24)
          .regex(/^(?![-]+$)[a-zA-Z0-9-]+$/),
        boardPublicId: z.string().min(12),
      }),
    )
    .output(
      z.object({
        isReserved: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const board = await boardRepo.getBoardIdByPublicId(
        ctx.db,
        input.boardPublicId,
      );

      if (!board)
        throw new TRPCError({
          message: `Board with public ID ${input.boardPublicId} not found`,
          code: "NOT_FOUND",
        });

      const isBoardSlugAvailable = await boardRepo.isBoardSlugAvailable(
        ctx.db,
        input.boardSlug,
      );

      return {
        isReserved: !isBoardSlugAvailable,
      };
    }),
});
