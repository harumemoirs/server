import { getAllBlogs,getBlogBySlug } from "../../../controllers/blog/blog.controller";
import { Hono } from "hono";


const userBlogRouter = new Hono();


userBlogRouter.get('/all-blogs',getAllBlogs);

userBlogRouter.get('/by-slug/:slug',getBlogBySlug)


export default userBlogRouter