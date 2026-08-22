export async function fetchResource(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`资源加载失败：${url} (${response.status})`);
  }
  return response;
}
