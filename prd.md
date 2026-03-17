# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Product Name

Sejda Clone (AI-powered PDF Toolkit)

## 2. Objective

Build a web-based PDF processing platform with modular tools like merge, split, convert, compress, and edit.

## 3. Target Users

- Students
- Developers
- Office users
- Businesses handling PDFs

## 4. Core Features

### Must Have (MVP)

- Upload PDF
- Merge PDFs
- Split PDFs
- Download processed file

### Should Have

- PDF → Word conversion
- Compression
- Page reordering

### Advanced

- PDF editor (text/image editing)
- OCR
- Digital signature

## 5. Functional Requirements

FR1: User uploads file
FR2: System stores file temporarily
FR3: User selects tool
FR4: System creates job
FR5: Worker processes job
FR6: User downloads result
FR7: File auto-deletes after TTL

## 6. Non-Functional Requirements

- Response time < 5s for small files
- Secure file handling (auto-delete)
- Scalability via workers
- Handle 100+ concurrent jobs

## 7. Monetization

- Free tier (limited tasks/hour)
- Paid plan (unlimited usage)

## 8. Success Metrics

- Daily active users
- Job success rate
- Avg processing time
- Conversion rate to paid
