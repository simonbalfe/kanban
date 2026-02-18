import { boardRouter } from "./routers/board";
import { cardRouter } from "./routers/card";
import { checklistRouter } from "./routers/checklist";
import { healthRouter } from "./routers/health";
import { labelRouter } from "./routers/label";
import { listRouter } from "./routers/list";
import { userRouter } from "./routers/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  board: boardRouter,
  card: cardRouter,
  checklist: checklistRouter,
  health: healthRouter,
  label: labelRouter,
  list: listRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
