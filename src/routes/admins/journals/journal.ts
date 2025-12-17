import { addJournal,editJournal,removeJournal,getAllJournals,getJournalById,getJournalBySlug } from "../../../controllers/journal/journal.controller";
import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
const journalRouter =  new Hono()

journalRouter.post("/add-journal",authMiddleware,addJournal)

journalRouter.put("/edit-journal/:id",authMiddleware,editJournal)

journalRouter.delete('/delete-journal',authMiddleware,removeJournal)

journalRouter.get("/all-journals",getAllJournals)

journalRouter.get("/journal-slug/:slug",getJournalBySlug)

journalRouter.get('/journal-id/:id',getJournalById)


export default journalRouter