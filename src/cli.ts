import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { generateText, ModelMessage, stepCountIs, streamText } from "ai";
import { tools } from "./tools";
import { model } from "./provider";
import { setConfirm, SYSTEM_PROMPT } from "./agent";

const MAX_HISTORY = 20;
function trimHistory(history: ModelMessage[]): ModelMessage[] {
    return history.length <= MAX_HISTORY
        ? history
        : history.slice(history.length - MAX_HISTORY);
}

export async function runAgentTurn(
    history: ModelMessage[]
): Promise<{ text: string; history: ModelMessage[] }> {
    const result = await generateText({
        model,
        temperature: 0,
        system: SYSTEM_PROMPT,
        tools,
        stopWhen: stepCountIs(8),
        messages: trimHistory(history),
        maxRetries: 2,
    });
    for (const [i, step] of result.steps.entries())
        for (const call of step.toolCalls ?? [])
            console.log(` [step ${i + 1}] ${call.toolName}(${JSON.stringify(call.input)})`);
    return {
        text: result.text,
        history: [...history, ...result.response.messages],
    };
}

export async function streamAgent(
    history: ModelMessage[]
): Promise<{ text: string; history: ModelMessage[] }> {
    const result = streamText({
        model,
        temperature: 0,
        system: SYSTEM_PROMPT,
        tools,
        stopWhen: stepCountIs(8),
        messages: trimHistory(history),
        maxRetries: 2,
    });

    for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
            process.stdout.write(part.text);
        } else if (part.type === "tool-call") {
            console.log(`  ${part.toolName}(${JSON.stringify(part.input)})`);
        }
    }
    process.stdout.write("\n");

    return {
        text: await result.text,
        history: [...history, ...(await result.response).messages],
    };
}

const rl = readline.createInterface({ input, output })
setConfirm(async (msg) => (await rl.question(`${msg} (y/n) `)).trim().toLowerCase() === "y");
let history: ModelMessage[] = [];

console.log("에이전트와 대화를 시작합니다. 종료하려면 exit으로 종료하세요.\n");

try {
    while(true) {
        const userInput = (await rl.question("\n> ")).trim();
        if (userInput === "exit" || userInput === "") break;
        history.push({ role: "user", content: userInput });
        // const turn = await runAgentTurn(history);
        const turn = await streamAgent(history);
        history.length = 0;
        history.push(...turn.history);
    }
} catch(error) {
    // 입력 종료
}

rl.close();