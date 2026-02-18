import { t } from "elysia";

export const boardTypeSchema = t.Union([
  t.Literal("regular"),
  t.Literal("template"),
]);

export const boardVisibilitySchema = t.Union([
  t.Literal("public"),
  t.Literal("private"),
]);

export const dueDateFilterSchema = t.Union([
  t.Literal("overdue"),
  t.Literal("today"),
  t.Literal("tomorrow"),
  t.Literal("next-week"),
  t.Literal("next-month"),
  t.Literal("no-due-date"),
]);

export const movePositionSchema = t.Union([
  t.Literal("start"),
  t.Literal("end"),
]);

export const hexColourCodeSchema = t.String({
  pattern: "^#[0-9a-fA-F]{6}$",
});

export const errorResponseSchema = t.Object({
  error: t.String(),
});

export const successResponseSchema = t.Object({
  success: t.Boolean(),
});

export const labelSummarySchema = t.Object({
  publicId: t.String(),
  name: t.String(),
  colourCode: t.Nullable(t.String()),
});

export type DueDateFilterKey = typeof dueDateFilterSchema.static;
