import { chat, ToolSchema, type ChatMessage, type ToolCall } from "./ollama-chat";
import { calculate } from "./tools/calc";
import { promises as fs } from "node:fs";
import path from "node:path";

const WORKSPACE = path.resolve(process.cwd(), "workspace");

type Tool = { 
    schema: ToolSchema; 
    run: (args: any) => Promise<string> | string;
};

const tools: Record<string, Tool> = {
    calculate: {
        schema: {
            type: "function",
            function: {
                name: "calculate",
                description: "수식을 계산합니다. 예: '17*23'",
                parameters: {
                    type: "object",
                    properties: {
                        expression: { 
                            type: "string",
                            description: "계산할 수식"
                        },
                    },
                    required: ["expression"],
                },
            },
        },
        run: ({expression}) => String(calculate(expression)),
    },
    currentTime: {
        schema: {
            type: "function",
            function: {
                name: "currentTime",
                description: "현재 시간을 ISO 문자열로 반환합니다.",
                parameters: {type: "object", properties: {}, required: []}
            },
        },
        run: () => new Date().toISOString(),
    },
    read_file: {
        schema: {
            type: "function",
            function: {
                name: "read_file",
                description: "workspace 폴더 안의 파일 내용을 읽습니다.",
                parameters: {
                    type: "object",
                        properties: { 
                            file: 
                            { 
                                type: "string", 
                                description: "workspace 기준 상대 경로"
                            }
                        },
                        required: ["file"],
                    },
            },
        },
        run: async ({file}) => fs.readFile(path.join(WORKSPACE, String(file)), "utf-8"),
    },
};

export async function runHandAgent(userInput: string, maxSteps = 6): Promise<string> {
    const messages: ChatMessage[] = [
        { role: "system", content: "당신은 도구를 쓸 수 있는 한국어 업무 조수입니다. 필요하면 도구를 호출하고, 충분하면 최종 답을 한국어로 답하세요." },
        { role: "user", content: userInput },
    ];
    const toolSchemas = Object.values(tools).map((t) => t.schema);

    for(let step = 0; step < maxSteps; step++) {
        const message = await chat(messages, toolSchemas);
        messages.push(message);

        const calls: ToolCall[] = message.tool_calls ?? [];
        if(calls.length === 0) return message.content;

        for(const call of calls) {
            const tool = tools[call.function.name];
            let result: string;

            try {
                result = tool ? await tool.run(call.function.arguments) : `알 수 없는 도구: ${call.function.name}`;
            } catch (error: unknown) {
                result = `도구 오류: ${error instanceof Error ? error.message : String(error)}`;
            }
            console.log(`  [step ${step}] ${call.function.name} (${JSON.stringify(call.function.arguments)}) -> ${result}`);
            messages.push({role: "tool", content: result, tool_name: call.function.name});
        }
    }

    throw new Error(`최대 단계(${maxSteps})를 초과했습니다.`);
}

const input = process.argv.slice(2).join(" ") || "17 곱하기 23은?";
console.log(await runHandAgent(input));