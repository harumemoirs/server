import { toggleBlogLike,checkBlogLike,getBlogLikes } from "../../../controllers/blog/bloglike.controller";
import { Hono } from "hono";

const userBlogLikeRouter = new Hono();

userBlogLikeRouter.post("/check-like/:id", checkBlogLike);


userBlogLikeRouter.post("/toggle-like/:id", toggleBlogLike);


userBlogLikeRouter.get("/likes/:slug", getBlogLikes);


export default userBlogLikeRouter