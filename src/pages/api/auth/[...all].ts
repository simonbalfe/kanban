import { withRateLimit } from "~/server/utils/rateLimit";

export const config = { api: { bodyParser: false } };

export default withRateLimit(
  { points: 100, duration: 60 },
  async (req, res) => {
    void req;
    res.status(410).json({ error: "Authentication is disabled in this build." });
  },
);
