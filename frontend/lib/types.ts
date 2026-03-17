// Shared TypeScript types for the PDF Processing SaaS frontend.
// Mirrors shared/schemas.py — keep in sync.

export type Tool = "merge" | "split" | "compress" | "convert";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface FileUploadResponse {
  file_id: string;
  filename: string;
  size: number;
}

export interface JobCreateRequest {
  tool: Tool;
  file_ids: string[];
  options?: Record<string, unknown>;
}

export interface JobCreateResponse {
  job_id: string;
  status: string;
}

export interface JobDetail {
  job_id: string;
  tool: Tool;
  status: JobStatus;
  progress: number;
  output_path: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ErrorResponse {
  detail: string;
}
