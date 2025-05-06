# PDF OCR Search

A Next.js application that allows users to upload PDF documents, perform OCR (Optical Character Recognition) on them, and search through the extracted text. This project combines modern web technologies with PDF processing capabilities to create a powerful document search tool.

## Features

- PDF document upload and processing
- OCR text extraction from PDFs
- Search functionality within processed documents
- Modern UI built with Next.js and Tailwind CSS
- TypeScript support for better development experience

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone git@github.com:Neerazan/pdf_ocr.git
cd pdf-ocr-search
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
```
Make sure to replace `your_google_api_key` with your actual Google API key for Gemini AI features.

## Running the Project

### Development Mode

To run the project in development mode:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Production Build

To create a production build:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm run start
# or
yarn start
```

## Project Structure

```
pdf-ocr-search/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
└── uploads/          # Temporary storage for uploaded PDFs
```

## Technologies Used

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- PDF.js
- PDF Parse
- PDF Lib
- React PDF
- Gemini (for AI features)
