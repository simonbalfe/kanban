import { z } from "zod";

export const boardTypeSchema = z.enum(["regular", "template"]);

export const boardVisibilitySchema = z.enum(["public", "private"]);

export const dueDateFilterSchema = z.enum([
  "overdue",
  "today",
  "tomorrow",
  "next-week",
  "next-month",
  "no-due-date",
]);

export const movePositionSchema = z.enum(["start", "end"]);

export const hexColourCodeSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export type DueDateFilterKey = z.infer<typeof dueDateFilterSchema>;
