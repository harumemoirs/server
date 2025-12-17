import { getLetterLikes,checkLetterLike,toggleLetterLike } from "../../../controllers/letter/letterlike.controller";
import { Hono } from "hono";

const userLetterLikeRouter = new Hono();

userLetterLikeRouter.post("/check-like/:id", checkLetterLike);


userLetterLikeRouter.post("/toggle-like/:id", toggleLetterLike);


userLetterLikeRouter.get("/likes/:slug", getLetterLikes);


export default userLetterLikeRouter;