import type {
  FileUploadResponse,
  JobCreateResponse,
  JobDetail,
  Tool,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: "An unexpected error occurred" }));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<FileUploadResponse>(response);
}

export async function createJob(
  tool: Tool,
  file_ids: string[],
  options?: Record<string, unknown>
): Promise<JobCreateResponse> {
  const body: { tool: Tool; file_ids: string[]; options?: Record<string, unknown> } = {
    tool,
    file_ids,
  };

  if (options) {
    body.options = options;
  }

  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<JobCreateResponse>(response);
}

export async function getJobStatus(jobId: string): Promise<JobDetail> {
  const response = await fetch(`${API_URL}/jobs/${jobId}`);
  return handleResponse<JobDetail>(response);
}

export function getDownloadUrl(jobId: string): string {
  return `${API_URL}/download/${jobId}`;
}
