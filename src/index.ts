import { Hono } from 'hono'
import {cors} from "hono/cors"
import authRouter from './routes/admins/auth'
import blogRouter from './routes/admins/blog/blog'
import journalRouter from './routes/admins/journals/journal'
import poemRouter from './routes/admins/poems/poem'
import blogLikeRouter from './routes/admins/blog/blog.like'
import journalLikeRouter from './routes/admins/journals/journal.like'
import poemLikeRouter from './routes/admins/poems/poem.like'
import letterRouter from './routes/admins/letter/letter'
import { logger } from 'hono/logger'
import letterLikeRouter from './routes/admins/letter/letter.like'
import userBlogRouter from './routes/users/blogs/blogs'
import userJournalRouter from './routes/users/journals/journal'
import userLetterRouter from './routes/users/letters/letter'
import userPoemRouter from './routes/users/poems/poem'
import userBlogLikeRouter from './routes/users/blogs/bloglike'
import userPoemLikeRouter from './routes/users/poems/poem.like'
import userJournalLikeRouter from './routes/users/journals/journallike'
import userLetterLikeRouter from './routes/users/letters/letterlike'
import subscribeRouter from './routes/admins/newsletter/subscribe'
import newsLetterRouter from './routes/admins/newsletter/newsletter'
import countRouter from './routes/users/count'

export type Env = {
  DATABASE_URL:string,
  JWT_SECRET:string
}

const app = new Hono<{Bindings:Env}>()

app.use("*", cors({
 origin:[ "https://haru-memoirs-admin.vercel.app","https://harumemoirs.xyz","https://admin.harumemoirs.xyz","http://localhost:3000"],
  credentials: true,
  allowHeaders: ["Content-Type"],
  exposeHeaders: ["Set-Cookie"],
}));
app.use(logger())

app.get('/health', (c) => {
  return c.text('API health status : working')
})

app.get('/', (c) => {
  return c.text('API health status : working')
})

//admin routers
app.route("/api/kairos/v1/admin/auth",authRouter)

app.route("/api/v1/admin/kairos/blogs",blogRouter)

app.route("/api/v1/admin/kairos/journals",journalRouter)

app.route('/api/v1/admin/kairos/poems',poemRouter)

app.route("/api/v1/admin/kairos/blog-like",blogLikeRouter)

app.route("/api/v1/admin/kairos/journal-like",journalLikeRouter)

app.route("/api/v1/admin/kairos/poem-like",poemLikeRouter)

app.route("/api/v1/admin/kairos/letters",letterRouter)

app.route('/api/v1/admin/kairos/letter-like',letterLikeRouter)

app.route('/api/v1/admin/kairos/newsletter',newsLetterRouter)

//user routers
app.route('/api/v2/newsletter',subscribeRouter)
//base router
app.route('/api/v2/blog',userBlogRouter)

app.route('/api/v2/journal',userJournalRouter)

app.route('/api/v2/letter',userLetterRouter)

app.route('/api/v2/poem',userPoemRouter)



//user like routers

app.route('/api/v2/blogs/user-like',userBlogLikeRouter)

app.route('/api/v2/poems/user-like',userPoemLikeRouter)

app.route('/api/v2/journals/user-like',userJournalLikeRouter)

app.route('/api/v2/letters/user-like',userLetterLikeRouter)


app.route('/api/v2/count',countRouter)

export default app
