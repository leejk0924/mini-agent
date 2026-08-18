export async function fetchUrl(url: string): Promise<string> {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000)});
    if (!res.ok) throw new Error(`요청 실패: ${res.status}`);
    const html = await res.text();
    const text = html
        .replace(/<script>[\s\S]*?<\/script>/gi, "")
        .replace(/<style>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trimEnd();
        return text.slice(0, 2000);
}