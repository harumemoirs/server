import { togglePoemLike,getPoemLikes,checkPoemLike } from "../../../controllers/poem/poemlike.controller";
import { Hono } from "hono";

const userPoemLikeRouter = new Hono();

userPoemLikeRouter.post("/check-like/:id", checkPoemLike)


userPoemLikeRouter.post("/toggle-like/:id", togglePoemLike);


userPoemLikeRouter.get("/likes/:id", getPoemLikes);


export default userPoemLikeRouter