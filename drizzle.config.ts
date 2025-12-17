import * as dotenv from "dotenv"
import type { Config } from "drizzle-kit"

dotenv.config({
    path:'.dev.vars'
})

const dbUrl = new URL(process.env.DATABASE_URL!);


export default{
    schema:"./src/db/schema.ts",
    out:"./drizzle/migrations",
    dialect:"postgresql",
    dbCredentials:{
        host:dbUrl.hostname,
        port:parseInt(dbUrl.port||"5432"),
        user:dbUrl.username,
        password:dbUrl.password,
        database:dbUrl.pathname.slice(1),
        ssl:"require"
    }
}satisfies Config