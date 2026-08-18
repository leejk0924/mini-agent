import { generateText, stepCountIs, streamText } from "ai";
import { model } from "./provider.js";
import { tools } from "./tools/index.js";

export let confirmFn: (msg: string) => Promise<boolean> = async ()=> true;
export function setConfirm(fn: (msg: string) => Promise<boolean>): void {
    confirmFn = fn;
}
export const SYSTEM_PROMPT = "당신은 도구를 쓸 수 있는 한국어 업무 助手 입니다. 파일을 읽고 쓰고, 웹을 가져오고, 계산하고, 사용자에 관한 사실을 기억할 수 있습니다. 필요할 때만 도구를 호출하고, 충분하면 한국어로 간결히 답하세요. 사용자가 새 선호 사실을 알려준다면, remember로 저장하세요.";