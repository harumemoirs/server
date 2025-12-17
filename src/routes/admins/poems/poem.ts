import { addPoem,editPoem,removePoem,getAllPoems,getPoemById,getPoemBySlug } from "../../../controllers/poem/poem.controller";
import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
const poemRouter =  new Hono()

poemRouter.post("/add-poem",authMiddleware,addPoem)

poemRouter.put("/edit-poem/:id",authMiddleware,editPoem)

poemRouter.delete('/delete-poem',authMiddleware,removePoem)

poemRouter.get("/all-poems",getAllPoems)

poemRouter.get("/poem-slug/:slug",getPoemBySlug)

poemRouter.get('/poem-id/:id',getPoemById)


export default poemRouter