import { promises as fs } from "node:fs";
import path from "node:path";

const MEMROY_PATH = path.resolve(process.cwd(), "memory.json");

export type Fact = { text: string; savedAt: string };

export async function loadFacts(): Promise<Fact[]> {
    try {
        return JSON.parse(await fs.readFile(MEMROY_PATH, "utf-8")) as Fact[];
    } catch {
        return [];
    }
}

export async function remember(text: string): Promise<string> {
    const facts = await loadFacts();
    facts.push({ text, savedAt: new Date().toISOString() });
    await fs.writeFile(MEMROY_PATH, JSON.stringify(facts, null, 2), "utf-8");
    return `기억함: ${text}`;
}

export async function recall(query: string): Promise<string> {
    const facts = await loadFacts();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matched = facts.filter((f) => 
    terms.some((t) => f.text.toLowerCase().includes(t)));
    return matched.length === 0 
        ? "관련된 기억이 없습니다."
        : matched.map((f) => `- ${f.text}`).join("\n");
}