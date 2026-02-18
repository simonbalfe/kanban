import type { api } from "~/utils/api";

export async function invalidateCard(
  utils: ReturnType<typeof api.useUtils>,
  cardPublicId: string,
) {
  if (!cardPublicId || cardPublicId.length < 12) return;

  await utils.card.byId.invalidate({ cardPublicId });
}
