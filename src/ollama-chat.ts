const OLLAMA_URL = "http://localhost:11434";
export const MODEL = "qwen2.5";

export type ToolCall = {
    function: {
        name: string;
        arguments: Record<string, unknown>;
    }
}

export type ToolSchema = {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: object;
    }
}

export type ChatMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_calls?: ToolCall[];
    tool_name?: string;
}

export async function chat(
    messages: ChatMessage[], 
    tools?: ToolSchema[],
): Promise<ChatMessage> {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            model: MODEL,
            messages: messages,
            tools,
            stream: false,
            options: {temperature: 0},
        }),
    });
    if (!response.ok) throw new Error(`Ollama 요청 실패: ${response.status}`);
    const data = (await response.json()) as { message: ChatMessage };
    return data.message;
}
