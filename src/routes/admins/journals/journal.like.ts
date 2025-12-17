// routes/blog-like.route.ts
import { Hono } from "hono";
import { checkJournalLike,toggleJournalLike,getJournalLikes } from "../../../controllers/journal/journallike.controller";

const journalLikeRouter = new Hono();

journalLikeRouter.post("/check-like/:id", checkJournalLike);


journalLikeRouter.post("/toggle-like/:id", toggleJournalLike);


journalLikeRouter.get("/likes/:id", getJournalLikes);

export default journalLikeRouter;
