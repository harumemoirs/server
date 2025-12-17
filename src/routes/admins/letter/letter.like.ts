import { Hono } from "hono";
import { checkLetterLike,toggleLetterLike, getLetterLikes} from "../../../controllers/letter/letterlike.controller";

const letterLikeRouter = new Hono();

letterLikeRouter.post("/check-like/:id", checkLetterLike);


letterLikeRouter.post("/toggle-like/:id", toggleLetterLike);


letterLikeRouter.get("/likes/:id", getLetterLikes);

export default letterLikeRouter;
