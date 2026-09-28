export async function getRepoTree(owner: string, repo: string, token: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch repo tree');
  return res.json();
}

export async function getFileContent(owner: string, repo: string, path: string, token: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch file content');
  const data = await res.json();
  // Content is base64 encoded
  return {
    content: atob(data.content),
    sha: data.sha
  };
}

export async function writeToFile(owner: string, repo: string, path: string, content: string, message: string, token: string, sha?: string) {
  const body: any = {
    message,
    content: btoa(content), // encode back to base64
  };
  
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Failed to write to repository');
  return res.json();
}
