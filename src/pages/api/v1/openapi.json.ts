import type { NextApiRequest, NextApiResponse } from "next";

import { openApiDocument } from "~/server/openapi";
import { withRateLimit } from "~/server/utils/rateLimit";

export default withRateLimit(
  { points: 100, duration: 60 },
  (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).send(openApiDocument);
  },
);
