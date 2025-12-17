 
import * as dotenv from "dotenv";
import { sign, verify } from "hono/jwt";
dotenv.config();

const createToken = async (adminId: string, secret: string) => {
  return sign({ id: adminId },secret);
};

const hashPassword = async (password: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
const verifyPassword = async (password: string, hashedPassword: string) => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
};
const verifyToken = async (token: string, secret: string) => {
  try {
    const payload = await verify(token, secret);
    return payload as {
      id:string;
      exp?:number;
      iat?:number
    };
  } catch (error) {
    return null;
  }
};

export { createToken, verifyToken ,hashPassword,verifyPassword};
