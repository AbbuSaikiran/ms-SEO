export function parseGitHubUrl(urlOrPath: string): { owner: string; repo: string } | null {
  const clean = urlOrPath.trim().replace(/\/$/, "");
  // Match https://github.com/owner/repo or git@github.com:owner/repo or owner/repo
  const httpsMatch = clean.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2].replace(/\.git$/, "") };
  }
  const simpleMatch = clean.match(/^([^/]+)\/([^/]+)$/);
  if (simpleMatch) {
    return { owner: simpleMatch[1], repo: simpleMatch[2].replace(/\.git$/, "") };
  }
  return null;
}

export async function getUserRepos(token: string) {
  const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch user repositories");
  return res.json();
}

export async function getRepoTree(owner: string, repo: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Try HEAD first to automatically resolve the default branch (main or master)
  let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
    headers,
  });

  if (!res.ok) {
    // Fallback to main
    res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers,
    });
  }

  if (!res.ok) {
    // Fallback to master
    res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
      headers,
    });
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch repository tree");
  }
  return res.json();
}

export async function getFileContent(owner: string, repo: string, path: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers,
  });
  if (!res.ok) throw new Error(`Failed to fetch file content for ${path}`);
  const data = await res.json();
  
  if (data.content && data.encoding === "base64") {
    // Decode base64 utf-8 properly
    const binaryString = atob(data.content.replace(/\s/g, ""));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoded = new TextDecoder().decode(bytes);
    return {
      content: decoded,
      sha: data.sha,
      size: data.size,
    };
  }

  return {
    content: data.content || "",
    sha: data.sha,
    size: data.size,
  };
}

export async function writeToFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  token: string,
  sha?: string,
  branch?: string
) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Content = btoa(binary);

  const body: any = {
    message,
    content: base64Content,
  };

  if (sha) {
    body.sha = sha;
  }

  if (branch) {
    body.branch = branch;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const rawMsg = err.message || "";
    if (rawMsg.includes("Resource not accessible by integration")) {
      throw new Error(
        "GitHub Permission Error: 'Resource not accessible by integration'.\n" +
        "Your GitHub Token lacks write access to this repository.\n" +
        "Fix: Go to GitHub Settings -> Developer Settings -> Personal Access Tokens (Fine-grained), select this repo, and set 'Contents: Read and write'."
      );
    }
    throw new Error(rawMsg || "Failed to push code to repository");
  }
  return res.json();
}

export async function pushCodeToGitHub(
  owner: string,
  repo: string,
  path: string,
  content: string,
  commitMessage: string,
  token: string,
  branch?: string,
  sha?: string
) {
  let fileSha = sha;
  if (!fileSha) {
    try {
      const existing = await getFileContent(owner, repo, path, token);
      fileSha = existing.sha;
    } catch {
      // Creating new file
    }
  }

  return writeToFile(owner, repo, path, content, commitMessage, token, fileSha, branch);
}
