import { getTotalCount } from "../../controllers/count.controller";
import { Hono } from "hono";


const countRouter = new Hono();

countRouter.get('/get-count',getTotalCount)


export default countRouter;