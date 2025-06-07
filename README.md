# AskMyDocs

AskMyDocs is an AI-powered document Q&A platform. Upload your documents and ask questions—get instant, intelligent answers powered by state-of-the-art AI models.

## Features

- Upload and store documents securely
- Ask questions and get answers from your documents
- Uses OpenAI and Gemini for AI-powered responses
- S3-compatible storage integration
- Modern, user-friendly web interface

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn or npm
- PostgreSQL (or your preferred database)
- AWS S3 or compatible storage (for document uploads)
- OpenAI API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/AskMyDocs.git
   cd AskMyDocs
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables:**
   - Copy the example files and fill in your secrets:
     ```bash
     cp .env.example .env.local
     cp server/.env.example server/.env
     cp client/.env.example client/.env
     ```
   - Edit the `.env` files with your API keys and configuration.

4. **Run database migrations (if applicable):**
   ```bash
   # Example for Prisma
   npx prisma migrate deploy
   ```

5. **Start the development server:**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

## Usage

- Visit `http://localhost:3000` in your browser.
- Upload documents and start asking questions!

## Security

**Never commit your real `.env` files or secrets to version control.**  
Use `.env.example` files for sharing configuration structure.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE) 