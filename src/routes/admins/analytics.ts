import { Hono } from "hono";
import { totalSubscribers,mostLikedBlog,mostLikedJournal,mostLikedLetter,mostLikedPoem } from "../../controllers/analytic.controller";
import { authMiddleware } from "../../middlewares/auth";

const analyticsRouter = new Hono();

analyticsRouter.get("/analytics/subscribers",authMiddleware, totalSubscribers);
analyticsRouter.get("/analytics/blog",authMiddleware, mostLikedBlog);
analyticsRouter.get("/analytics/journal",authMiddleware, mostLikedJournal);
analyticsRouter.get("/analytics/poem",authMiddleware, mostLikedPoem);
analyticsRouter.get("/analytics/letter",authMiddleware, mostLikedLetter);

export default analyticsRouter;
