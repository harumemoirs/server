// routes/blog-like.route.ts
import { Hono } from "hono";
import { checkBlogLike,toggleBlogLike,getBlogLikes } from "../../../controllers/blog/bloglike.controller";

const blogLikeRouter = new Hono();

blogLikeRouter.post("/check-like/:id", checkBlogLike);


blogLikeRouter.post("/toggle-like/:id", toggleBlogLike);


blogLikeRouter.get("/likes/:id", getBlogLikes);

export default blogLikeRouter;
