                    ┌──────────────────────┐
                    │      Frontend        │
                    │  (Next.js / React)   │
                    └─────────┬────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │   API Gateway Layer  │
                    │ (Node / FastAPI)     │
                    └─────────┬────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Service │ │ File Service │ │ Job Service │
└──────────────┘ └──────────────┘ └──────┬───────┘
│
▼
┌────────────────┐
│ Job Queue │
│ Redis / Rabbit │
└──────┬─────────┘
│
┌────────────────────────┼────────────────────┐
▼ ▼ ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ PDF Worker │ │ Convert Worker │ │ OCR Worker │
│ (merge/split) │ │ (pdf ↔ word) │ │ (Tesseract) │
└────────┬───────┘ └────────┬───────┘ └────────┬───────┘
│ │ │
▼ ▼ ▼
┌───────────────────────────────────────────────┐
│ Temporary Storage (S3 / Local) │
└───────────────────────────────────────────────┘
│
▼
┌──────────────────┐
│ CDN / Download │
└──────────────────┘

🔑 Key Design Principles (based on Sejda behavior)

Tools are independent modules (merge, split, etc.)

Files are temporary + auto-deleted (~2 hours)

Processing is server-side jobs

UI is task-based workflow (upload → process → download)

🧠 Core Microservices
Service Responsibility
API Gateway Entry point
File Service Upload/download/delete
Job Service Create job + status
Worker Services Process PDFs
Cleanup Service Delete files (cron)
