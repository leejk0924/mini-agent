import { calculate } from "./calc.js";
import { listFiles, readFile, searchFiles, writeFile } from "./files.js";
import { fetchUrl } from "./web.js";
import { z } from "zod";
import { tool } from "ai";
import { rememberTool } from "./memory.js";
import { recallTool } from "./memory.js"
import { confirmFn } from "../agent.js";

const wrap = (fn: (a: any) => Promise<string> | string) => async (args: any): Promise<string> => {
    try {
        return await fn(args);
    } catch (error: unknown) {
        return `도구 오류: ${error instanceof Error ? error.message : String(error)}`;
    }
}

export const tools = {
    calulate: tool({
        description: "산술 수식을 계산합니다. 예: '17*23'",
        inputSchema: z.object ({ expression: z.string().describe("계산할 수식") }),
        execute: wrap(({ expression }) => String(calculate(expression))),
    }),
    read_file: tool({
        description: "workspace 안의 파일을 읽습니다.",
        inputSchema: z.object({ file: z.string().describe("읽을 파일의 상대 경로") }),
        execute: wrap(({ file }) => readFile(file)),
    }),
    write_file: tool({
        description: "workspace 안에 파일을 만들거나 덮어씁니다.",
        inputSchema: z.object({
            file: z.string(),
            content: z.string(),
        }),
        execute: wrap(async ({ file, content }) => {
            if (!(await confirmFn(`'${file}'에 ${content.length}자를 씁니다. 진행할까요?`)))
                return "사용자가 쓰기를 취소하였습니다.";
            return writeFile(file, content);
        })
    }),
    list_files: tool({
        description: "workspace의 파일 목록을 봅니다.",
        inputSchema: z.object({ dir: z.string().default(".").describe("조회할 폴더 경로. 기본 값은 루트")}),
        execute: wrap(async ({ dir }) => (await listFiles(dir)).join("\n")),
    }),
    search_files: tool({
        description: "workspace 파일 내용에서 키워드를 찾습니다.",
        inputSchema: z.object({ query: z.string().describe("검색할 키워드")}),
        execute: wrap(async ({ query }) => {
            const xs = await searchFiles(query);
            return xs.length ? xs.join("\n") : "없음";
        })
    }),
    fetch_url: tool({
        description: "웹 페이지를 가져와 본문 텍스트를 반환합니다.",
        inputSchema: z.object({ url: z.string().url().describe("가져올 웹 페이지 URL")}),
        execute: wrap(({ url }) => fetchUrl(url)),
    }),
    remember: rememberTool,
    recall: recallTool
};