import type {
  FileUploadResponse,
  JobCreateResponse,
  JobDetail,
  Tool,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithWakeUp(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      throw new Error(
        "Our processing server is waking up to save energy! This takes about 1-2 minutes. Please wait a bit and try submitting again."
      );
    }
    throw err;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 500 || response.status === 503 || response.status === 502) {
      throw new Error(
        "The server is currently starting up from sleep mode. This usually takes 1-2 minutes. Please wait a moment and try again!"
      );
    }
    const errorBody = await response.json().catch(() => ({ detail: "An unexpected error occurred" }));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithWakeUp(`${API_URL}/upload`, {
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

  const response = await fetchWithWakeUp(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<JobCreateResponse>(response);
}

export async function getJobStatus(jobId: string): Promise<JobDetail> {
  const response = await fetchWithWakeUp(`${API_URL}/jobs/${jobId}`);
  return handleResponse<JobDetail>(response);
}

export function getDownloadUrl(jobId: string): string {
  return `${API_URL}/download/${jobId}`;
}

export async function getSuggestedFont(fileId: string): Promise<string> {
  try {
    const response = await fetchWithWakeUp(`${API_URL}/files/${fileId}/font`);
    if (response.ok) {
      const data = await response.json();
      return data.font || "Helvetica";
    }
  } catch (e) {
    console.warn("Failed to suggest font", e);
  }
  return "Helvetica";
}
