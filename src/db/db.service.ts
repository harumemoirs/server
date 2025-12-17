import { neon } from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http"
import * as schema from "./schema"

export interface Env {
    DATABASE_URL:string
}

export const getDb = (databaseUrl:string)=>{
    const client = neon(databaseUrl)
    return drizzle(client,{schema})
}