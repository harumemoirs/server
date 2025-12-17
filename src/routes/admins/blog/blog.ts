import { addBlog,editBlog,removeBlog,getAllBlogs,getBlogById,getBlogBySlug } from "../../../controllers/blog/blog.controller";
import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
const blogRouter =  new Hono()

blogRouter.post("/add-blog",authMiddleware,addBlog)

blogRouter.put("/edit-blog/:id",authMiddleware,editBlog)

blogRouter.delete('/delete-blog',authMiddleware,removeBlog)

blogRouter.get("/all-blogs",getAllBlogs)

blogRouter.get("/blog-slug/:slug",getBlogBySlug)

blogRouter.get('/blog-id/:id',getBlogById)


export default blogRouter