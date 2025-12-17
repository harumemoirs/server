import { getLetterById,getLetterByTitle,getAllLetters, getLetterBySlug } from "../../../controllers/letter/letter.controller";
import { Hono } from "hono";

const userLetterRouter = new Hono();

userLetterRouter.get('/all-letters',getAllLetters)

userLetterRouter.get('/letter-id/:id',getLetterById)

userLetterRouter.get('/letter-title/:title',getLetterByTitle)

userLetterRouter.get('/by-slug/:slug',getLetterBySlug)

export default userLetterRouter