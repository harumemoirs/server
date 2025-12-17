import { broadcastNewsletter } from "../../../controllers/newsletter/newsletter.controller";
import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
import { getAllSubscribers, removeSubscriber } from "../../../controllers/newsletter/subscriber.controller";

const newsLetterRouter = new Hono();

newsLetterRouter.post('/broadcast',authMiddleware,broadcastNewsletter)

newsLetterRouter.get('/get-subscribers',authMiddleware,getAllSubscribers)

newsLetterRouter.post('/remove-subscriber',authMiddleware,removeSubscriber)

export default newsLetterRouter