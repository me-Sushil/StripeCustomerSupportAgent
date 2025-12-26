# Stripe Customer Support Agent 🤖

> An intelligent, AI-powered customer support system using RAG (Retrieval Augmented Generation) architecture with vector search and LLM integration.


## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Development Workflow](#-development-workflow)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---



## 🎯 About The Project

**Stripe Customer Support Agent** is an intelligent documentation assistant that combines the power of AI, vector search, and natural language processing to provide instant, accurate answers to Stripe API questions.

### The Problem
Traditional documentation search relies on keyword matching, which often fails to understand what users actually need. Users spend time searching through multiple pages to find answers.

### Our Solution
This project uses **RAG (Retrieval Augmented Generation)** technology to:
- Understand the meaning behind user questions (not just keywords)
- Search through documentation semantically
- Generate natural, conversational responses
- Cite sources for every answer
- Remember conversation context

### What Makes It Special
- ✅ **Smart Search**: Understands intent, not just keywords
- ✅ **Accurate Answers**: Responses based on actual documentation
- ✅ **Source Citations**: Every answer includes references
- ✅ **Beautiful UI**: Modern, responsive chat interface
- ✅ **Admin Control**: Full pipeline management dashboard
- ✅ **Two Modes**: Standard and MCP-enhanced versions

---

## ✨ Key Features

### For End Users (Customer Support)
- 🤖 **AI-Powered Chat**: Ask questions in natural language
- 📚 **Source Citations**: See where answers come from
- 💬 **Conversation History**: Context-aware responses
- 📱 **Responsive Design**: Works on mobile, tablet, and desktop
- ⚡ **Fast Responses**: Get answers in seconds
- 👍 **Feedback System**: Rate answer quality
- 📋 **Copy to Clipboard**: Easy to save responses

### For Administrators (Management)
- 🕷️ **Web Scraping**: Automatically scrape documentation
- ✂️ **Smart Chunking**: Break documents into searchable pieces
- 🧠 **AI Embeddings**: Convert text to vector representations
- 🔍 **Vector Search**: Find relevant content semantically
- 📊 **Dashboard**: Monitor system health and statistics
- 🔄 **Pipeline Control**: Manage the entire data processing flow
- 📈 **Analytics**: Track usage and performance

---

## 🔄 How It Works

### Simple Explanation

```
1. Documentation → We scrape Stripe docs and store them
2. Processing → Break into chunks and create AI embeddings
3. Storage → Save in vector database for fast search
4. User Question → Convert question to vector
5. Search → Find similar documentation chunks
6. AI Response → Generate natural answer with sources
```

### Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN SIDE                                             │
│                                                         │
│  1. Add URLs (Stripe Documentation)                    │
│         ↓                                               │
│  2. Scrape & Store (PostgreSQL)                        │
│         ↓                                               │
│  3. Chunk Text (Smart splitting)                       │
│         ↓                                               │
│  4. Create Embeddings (AI vectors)                     │
│         ↓                                               │
│  5. Store in Vector Database (Pinecone)                │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  USER SIDE                                              │
│                                                         │
│  1. User asks: "How do I create a payment intent?"     │
│         ↓                                               │
│  2. Convert question to vector                         │
│         ↓                                               │
│  3. Search vector database for similar content         │
│         ↓                                               │
│  4. Get relevant documentation chunks                  │
│         ↓                                               │
│  5. Send to AI (Gemini) with context                   │
│         ↓                                               │
│  6. Generate natural response + sources                │
│         ↓                                               │
│  7. Display to user in beautiful chat UI               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web server framework
- **PostgreSQL** - Database for documents and conversations
- **Sequelize** - Database ORM
- **Pinecone** - Vector database for semantic search
- **Google Gemini** - AI for embeddings and chat responses
- **Puppeteer/Cheerio** - Web scraping tools
- **LangChain** - Text processing and chunking

### Frontend
- **React** - UI framework
- **Redux Toolkit** - State management (Admin)
- **TailwindCSS** - Styling
- **Vite** - Build tool
- **React Markdown** - Render formatted responses

### AI & Search
- **Gemini Embeddings** - Convert text to 768-dimensional vectors
- **Gemini Pro** - Generate conversational responses
- **Pinecone** - Vector similarity search
- **MCP** - Model Context Protocol for enhanced responses

---

## 📋 Prerequisites

Before you begin, make sure you have:

### Required Software
1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Check version: `node --version`

2. **PostgreSQL** (latest version)
   - macOS: `brew install postgresql`
   - Windows: Download from https://www.postgresql.org/
   - Linux: `sudo apt install postgresql`

3. **Git** (to clone repository)
   - Download from: https://git-scm.com/

### Required API Keys
1. **Google Gemini API Key** (Free tier available)
   - Get from: https://makersuite.google.com/app/apikey
   - Used for: AI embeddings and chat responses

2. **Pinecone API Key** (Free tier: 1 index, 100K vectors)
   - Sign up at: https://www.pinecone.io/
   - Used for: Vector database storage

..........................................................................................
## 🎯 Overview

The **Stripe Customer Support Agent** is a sophisticated AI-powered documentation assistant that helps users find accurate answers to their Stripe API questions. The system combines:

- **Web Scraping**: Automatically scrapes and indexes Stripe documentation
- **Vector Search**: Uses semantic search to find relevant content
- **LLM Integration**: Generates natural, contextual responses using Google's Gemini
- **Conversation Tracking**: Maintains chat history for context-aware responses
- **Admin Dashboard**: Full control over data pipeline and system management
- **User Chat Interface**: Beautiful, responsive chat UI for end-users

### Why This Project?

Traditional documentation search relies on keyword matching, which often fails to understand user intent. This project implements RAG (Retrieval Augmented Generation) to:

1. **Understand Context**: Semantic search finds relevant information even with different wording
2. **Provide Accurate Answers**: LLM generates responses based on actual documentation
3. **Cite Sources**: Every answer includes references to source documentation
4. **Learn from Conversations**: Maintains context across multiple questions

---

## ✨ Features

### Core Features

#### 🔍 **Intelligent Search**
- Semantic search using vector embeddings
- Context-aware results
- Multi-source citation
- Relevance scoring

#### 🤖 **AI-Powered Responses**
- Natural language generation with Gemini
- Two versions: Standard and MCP-enhanced
- Markdown formatting support
- Code snippet highlighting

#### 📚 **Documentation Management**
- Web scraping (Puppeteer + Cheerio)
- Automatic chunking with LangChain
- Vector embedding (768-dimensional)
- Pinecone vector database storage

#### 💬 **User Chat Interface**
- Beautiful, responsive design
- Real-time message updates
- Source citations with links
- Conversation history
- Feedback system (thumbs up/down)
- Copy to clipboard
- Example questions

#### 🎛️ **Admin Dashboard**
- Document scraping interface
- Chunk management
- Vector processing pipeline
- System statistics
- Health monitoring

### Advanced Features

#### 🔄 **Complete Data Pipeline**
```
URL Input → Scraping → Chunking → Embedding → Vector Storage → Search → LLM Response
```

#### 🎨 **Responsive Design**
- Mobile-first approach
- Tablet optimized
- Desktop enhanced
- Smooth animations
- Universal sidebar navigation

#### 🔐 **Data Persistence**
- PostgreSQL for structured data
- Pinecone for vector storage
- Conversation history tracking
- Session management

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Admin Frontend  │         │  User Frontend   │          │
│  │  (React + Redux) │         │  (React)         │          │
│  └────────┬─────────┘         └─────────┬────────┘          │
│           │                              │                  │
└───────────┼──────────────────────────────┼─────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                   APPLICATION LAYER                        │
│           ┌───────────────┴────────────────┐               │
│           │   Express.js API Server        │               │
│           │                                │               │
│           │  ┌──────────────────────────┐  │               │
│           │  │  Admin Routes            │  │               │
│           │  │  - Scraping              │  │               │
│           │  │  - Chunking              │  │               │
│           │  │  - Embedding             │  │               │
│           │  │  - Vector Processing     │  │               │
│           │  └──────────────────────────┘  │               │
│           │                                │               │
│           │  ┌──────────────────────────┐  │               │
│           │  │  Chat Routes             │  │               │
│           │  │                          │  │               │
│           │  │  - Query (with MCP)      │  │               │
│           │  │  - Conversations         │  │               │
│           │  │  - Feedback              │  │               │
│           │  └──────────────────────────┘  │               │
│           └────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│           ┌───────────────┴────────────────┐                 │
│           │        Services                 │                │
│           │                                 │                │
│           │  • Scraper Service              │                │
│           │  • Chunker Service              │                │
│           │  • Embedder Service             │                │
│           │  • Vector Store Service         │                │
│           │  • Chat Service (MCP)           │                │
│           │                                 │                │
│           └─────────────────────────────────┘                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                      DATA LAYER                             │
│           ┌───────────────┴────────────────┐                │
│           │                                │                │
│  ┌────────────────┐              ┌──────────────────┐       │
│  │  PostgreSQL    │              │  Pinecone        │       │
│  │  (Sequelize)   │              │  Vector DB       │       │
│  │                │              │                  │       │
│  │ • Documents    │              │ • Embeddings     │       │
│  │ • Chunks       │              │ • Vector Search  │       │
│  │ • Conversations│              │                  │       │
│  │ • Messages     │              │                  │       │
│  └────────────────┘              └──────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│           ┌───────────────┴────────────────┐                │
│           │                                │                │
│  ┌────────────────┐              ┌──────────────────┐       │
│  │  Google Gemini │              │  MCP Server      │       │
│  │  - Embeddings  │              │  (Optional)      │       │
│  │  - Chat LLM    │              │                  │       │
│  └────────────────┘              └──────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. **Document Processing Pipeline**

```
Step 1: Web Scraping
┌──────────────┐
│ Stripe Docs  │
│ (HTML Pages) │
└──────┬───────┘
       │
       │ Puppeteer/Cheerio
       ↓
┌──────────────┐
│ Raw HTML     │
│ Stored in    │
│ PostgreSQL   │
└──────┬───────┘
       │
Step 2: Text Chunking
       │
       │ LangChain TextSplitter
       ↓
┌──────────────┐
│ Text Chunks  │
│ (1000 chars) │
│ Stored in    │
│ PostgreSQL   │
└──────┬───────┘
       │
Step 3: Embedding
       │
       │ Gemini API (text-embedding-004)
       ↓
┌──────────────┐
│ 768-dim      │
│ Vectors      │
└──────┬───────┘
       │
Step 4: Vector Storage
       │
       │ Upsert to Pinecone
       ↓
┌──────────────┐
│ Pinecone     │
│ Vector Index │
└──────────────┘
```

#### 2. **User Query Flow**

```
User Question
     │
     │ "How do I create a payment intent?"
     ↓
┌────────────────┐
│ Query Received │
│ by Chat API    │
└────────┬───────┘
         │
Step 1: Vector Search
         │
         │ Convert query to embedding
         │ Search Pinecone for top K similar chunks
         ↓
┌────────────────┐
│ Relevant Chunks│
│ (with scores)  │
└────────┬───────┘
         │
Step 2: Context Building
         │
         │ Format chunks into readable context
         │ (Optional: Enhance with MCP)
         ↓
┌────────────────┐
│ Context String │
└────────┬───────┘
         │
Step 3: LLM Generation
         │
         │ Send to Gemini with system prompt
         │ Context + Query → Response
         ↓
┌────────────────┐
│ AI Response    │
│ (Markdown)     │
└────────┬───────┘
         │
Step 4: Save & Return
         │
         │ Save to conversations table
         │ Return with sources
         ↓
┌────────────────┐
│ JSON Response  │
│ to Frontend    │
└────────────────┘
```

---

## 🛠️ Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥18.0.0 | Runtime environment |
| **Express.js** | 4.21.2 | Web framework |
| **PostgreSQL** | Latest | Primary database |
| **Sequelize** | 6.37.5 | ORM for PostgreSQL |
| **Pinecone** | 3.0.0 | Vector database |
| **Google Gemini** | 0.21.0 | LLM & embeddings |
| **LangChain** | 0.1.0 | Text splitting |
| **Puppeteer** | 23.11.1 | Web scraping (JS pages) |
| **Cheerio** | 1.0.0 | HTML parsing |
| **Axios** | 1.7.9 | HTTP client |
| **MCP SDK** | 1.0.4 | Model Context Protocol |

### Frontend

#### Admin Dashboard
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **Redux Toolkit** | 2.3.0 | State management |
| **React Router** | 6.28.0 | Routing |
| **TailwindCSS** | 3.4.15 | Styling |
| **Axios** | 1.7.9 | API calls |
| **Lucide React** | 0.460.0 | Icons |
| **React Hot Toast** | 2.4.1 | Notifications |
| **Vite** | 6.0.1 | Build tool |

#### User Chat Interface
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **React Markdown** | 9.0.1 | Markdown rendering |
| **Lucide React** | 0.460.0 | Icons |
| **TailwindCSS** | 3.4.15 | Styling |
| **Vite** | 6.0.1 | Build tool |

### External Services

- **Google Gemini API**: Text embeddings & chat completions
- **Pinecone**: Vector database and similarity search
- **PostgreSQL**: Structured data storage

---




## 🚀 Installation

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/stripe-support-agent.git
cd stripe-support-agent

# Or download ZIP and extract
```

### 2. Backend Setup

```bash
# Install backend dependencies
npm install



### 3. Database Setup
# Windows: Start from Services app

# Create database
psql postgres



### 4. Environment Configuration

Create `.env` file in project root:

```bash
# Copy example env file
cp .env.example .env

# Or create manually
touch .env
```

Add the following to `.env`:

```env
# ===================================
# DATABASE CONFIGURATION
# ===================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stripe_support


# ===================================
# GOOGLE GEMINI API
# ===================================
GEMINI_API_KEY=your_gemini_api_key_here

# ===================================
# PINECONE CONFIGURATION
# ===================================
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=stripe-docs

# ===================================
# SERVER CONFIGURATION
# ===================================
PORT=3000

```
### 5. Admin Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:3000
EOF

# Go back to root
cd ..
```

### 6. User Frontend Setup

```bash
# Navigate to user frontend
cd user-frontend

# Install dependencies
npm install
npm install react-markdown lucide-react

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:3000




# Expected output:
# 🚀 Starting Stripe Customer Support Agent...
# ✅ PostgreSQL connection established
# ✅ Pinecone initialized
# ✅ Chat services ready
# 🌟 Server running on port 3000
```

**Terminal 2: Admin Frontend**
```bash
cd stripe-support-agent/frontend
npm run dev

```
**Terminal 3: User Frontend**
```bash
cd stripe-support-agent/user-frontend
npm run dev

### Access Points

| Interface | URL | Purpose |
|-----------|-----|---------|
| **Backend API** | http://localhost:3000 | REST API endpoints |
| **Admin Dashboard** | http://localhost:5173 | Document management |
| **User Chat** | http://localhost:5174 | Customer support chat |



**Happy Building! 🚀**

If you find this project helpful, please give it a ⭐ on GitHub!