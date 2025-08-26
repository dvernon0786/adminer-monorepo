import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export const geminiFlash = () => genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 