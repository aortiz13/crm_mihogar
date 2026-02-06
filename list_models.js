const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
        const data = await response.json();
        console.log("Models (v1):", JSON.stringify(data, null, 2));

        const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
        const dataBeta = await responseBeta.json();
        console.log("Models (v1beta):", JSON.stringify(dataBeta, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
