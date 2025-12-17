import { toggleJournalLike,getJournalLikes,checkJournalLike } from "../../../controllers/journal/journallike.controller";
import { Hono } from "hono";

const userJournalLikeRouter = new Hono();

userJournalLikeRouter.post("/check-like/:id", checkJournalLike);


userJournalLikeRouter.post("/toggle-like/:id", toggleJournalLike);


userJournalLikeRouter.get("/likes/:slug", getJournalLikes);


export default userJournalLikeRouter;