 
import { Hono } from "hono";
import { checkPoemLike,togglePoemLike,getPoemLikes } from "../../../controllers/poem/poemlike.controller";

const poemLikeRouter = new Hono();

poemLikeRouter.post("/check-like/:id", checkPoemLike);


poemLikeRouter.post("/toggle-like/:id", togglePoemLike);


poemLikeRouter.get("/likes/:id", getPoemLikes);

export default poemLikeRouter;
