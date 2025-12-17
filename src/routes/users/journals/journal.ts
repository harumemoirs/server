import { Hono } from "hono";
import { getAllJournals,getJournalById,getJournalBySlug } from "../../../controllers/journal/journal.controller";

const userJournalRouter = new Hono();

userJournalRouter.get('/all-journals',getAllJournals)

userJournalRouter.get('/journal-slug/:slug',getJournalBySlug)

userJournalRouter.get('/journal-id:/id',getJournalById)


export default userJournalRouter