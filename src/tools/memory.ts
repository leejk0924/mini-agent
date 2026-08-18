import { tool } from "ai";
import { z } from "zod";
import { remember, recall } from "../memory-store.js";

export const rememberTool = tool({
    description: "사용자에 관한 사실이나 선호를 장기 기억에 저장한다.",
    inputSchema: z.object({
        fact: z.string().describe("기억할 한 문장"),
    }),
    execute: async ({ fact }) => remember(fact),
});

export const recallTool = tool({
    description: "장기 기억에서 질의와 관련된 사실을 찾습니다.",
    inputSchema: z.object({
        query: z.string().describe("찾을 키워드"),
    }),
    execute: async ({ query }) => recall(query),
})