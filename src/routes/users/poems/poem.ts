import { getAllPoems,getPoemById,getPoemBySlug } from "../../../controllers/poem/poem.controller";
import { Hono } from "hono";

const userPoemRouter = new Hono();

userPoemRouter.get('/all-poems',getAllPoems)

userPoemRouter.get('/poem-id/:id', getPoemById);

userPoemRouter.get('/by-slug/:slug', getPoemBySlug);
userPoemRouter.get('/poem-slug/:slug', getPoemBySlug);
userPoemRouter.get('/poem--slug/:slug', getPoemBySlug);

export default userPoemRouter