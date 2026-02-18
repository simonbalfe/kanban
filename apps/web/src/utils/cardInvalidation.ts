import type { QueryClient } from "@tanstack/react-query";
import { apiKeys } from "~/utils/api";

export async function invalidateCard(
  queryClient: QueryClient,
  cardPublicId: string,
) {
  if (!cardPublicId || cardPublicId.length < 12) return;

  await queryClient.invalidateQueries({
    queryKey: apiKeys.card.byId({ cardPublicId }),
  });
}
