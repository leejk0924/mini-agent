import { promises as fs, mkdir} from "node:fs";
import path from "node:path";

const WORKSPACE = path.resolve(process.cwd(), "workspace");

function resolveInWorkspace(rel: string): string {
    const abs = path.resolve(WORKSPACE, rel);
    if(abs !== WORKSPACE && !abs.startsWith(WORKSPACE + path.sep)) {
        throw new Error("워크스페이스 밖 경로는 허용되지 않습니다.");
    }
    return abs;
}

export async function readFile(file: string): Promise<string> {
    return fs.readFile(resolveInWorkspace(file), "utf-8");
}

export async function writeFile(file: string, content: string): Promise<string> {
    const abs = resolveInWorkspace(file);
    await fs.mkdir(path.dirname(abs), { recursive: true});
    await fs.writeFile(abs, content, "utf-8");
    return `${file} 저장됨 (${content.length}자)`;
}

export async function listFiles(dir = "."): Promise<string[]> {
    const entries = await fs.readdir(resolveInWorkspace(dir), {withFileTypes: true});
    return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
}

export async function searchFiles(query: string): Promise<string[]> {
    const hits: string[] = [];
    async function walk(rel: string): Promise<void> {
        for (const e of await fs.readdir(resolveInWorkspace(rel), { withFileTypes: true})) {
            const childRel = path.join(rel, e.name);
            if(e.isDirectory()) await walk(childRel);
            else if ((await fs.readFile(resolveInWorkspace(childRel), "utf-8"))
                .includes(query)) hits.push(childRel);
        }
    }
    await walk(".");
    return hits;
}