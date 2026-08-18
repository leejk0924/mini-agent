import { generateText } from "ai";
import { model } from "./provider.js";

const result = await generateText({
    model,
    temperature: 0,
    prompt: "안녕이라고 짧게 대답해줘",
});

console.log(result.text);