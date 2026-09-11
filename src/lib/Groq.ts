import groq from "groq-sdk";
import env from "./env";

const Groq = new groq({ apiKey: env.GROQ_API_KEY });
export default Groq;