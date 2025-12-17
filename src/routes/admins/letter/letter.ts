import { addLetter,editLetter,getAllLetters,getLetterById,getLetterByTitle,removeLetter } from "../../../controllers/letter/letter.controller";
import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";


const letterRouter = new Hono();


letterRouter.get('/all-letters',getAllLetters)

letterRouter.post('/add-letter',authMiddleware,addLetter)

letterRouter.put('/edit-letter/:id',authMiddleware,editLetter)

letterRouter.delete('/remove-letter',authMiddleware,removeLetter)

letterRouter.get('/letter-id/:id',getLetterById)

letterRouter.get('/letter-title/:title',getLetterByTitle)

export default letterRouter;