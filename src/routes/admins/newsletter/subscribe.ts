import { getAllSubscribers, removeSubscriber, subscribe, unsubscribe } from "../../../controllers/newsletter/subscriber.controller";
import { Hono } from "hono";
 
const subscribeRouter = new Hono();

 
subscribeRouter.post('/subscribe',subscribe)

subscribeRouter.get('/unsubscribe',unsubscribe)

export default subscribeRouter