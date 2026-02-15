// ========================
// 2. 解析参数 key="value"
// ========================
/** 解析 GitBook 参数，如 style="info" lang="ts" */
export function parseParams(str: string) {
  const params: Record<string, string> = {};
  const re = /(\w+)="(.*?)"/g;
  let m: RegExpExecArray | null = null;
  while (true) {
    m = re.exec(str);
    if (!m) break;
    params[m[1]] = m[2];
  }
  return params;
}
