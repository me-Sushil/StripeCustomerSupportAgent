// ============================================
// user-frontend/src/App.jsx
// Main user-facing chat application
// ============================================

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  Copy,
  ExternalLink,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import "./App.css";

// API Configuration
const USE_MCP = import.meta.env.VITE_API_URL;

function App() {
  // State management
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showSources, setShowSources] = useState({});

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load conversation from sessionStorage
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem("sessionId");
    const savedMessages = sessionStorage.getItem("messages");

    if (savedSessionId && savedMessages) {
      setSessionId(savedSessionId);
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save conversation to sessionStorage
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem("sessionId", sessionId);
      sessionStorage.setItem("messages", JSON.stringify(messages));
    }
  }, [sessionId, messages]);

  /**
   * Send message to API
   */
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Choose endpoint based on MCP setting
      const endpoint = USE_MCP;

      const response = await fetch(`${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage.content,
          sessionId: sessionId,
          topK: 5,
          minScore: 0.5,
          useMCP: USE_MCP,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      // Update sessionId if new
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Add assistant response
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        sources: data.sources || [],
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMessage = {
        role: "assistant",
        content: `I'm sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Handle key press in input
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Copy message to clipboard
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  /**
   * Reset conversation
   */
  const resetConversation = () => {
    setMessages([]);
    setSessionId(null);
    sessionStorage.removeItem("sessionId");
    sessionStorage.removeItem("messages");
    inputRef.current?.focus();
  };

  /**
   * Toggle source visibility for a message
   */
  const toggleSources = (index) => {
    setShowSources((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  /**
   * Example questions
   */
  const exampleQuestions = [
    "How do I create a payment intent?",
    "What are the Stripe test card numbers?",
    "How do I handle webhook events?",
    "How to set up recurring billing?",
    "What's the difference between payment intent and charge?",
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Sparkles className="logo-icon" />
            <div>
              <h1>Stripe Support Assistant</h1>
              <p>Powered by AI {USE_MCP ? "+ MCP" : ""}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={resetConversation} className="reset-btn">
              <RotateCcw size={18} />
              New Chat
            </button>
          )}
        </div>
      </header>

      {/* Chat Container */}
      <main className="chat-container">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="welcome">
            <div className="welcome-icon">
              <Sparkles size={64} />
            </div>
            <h2>Welcome to Stripe Support Assistant</h2>
            <p>
              Ask me anything about Stripe API, payments, webhooks, and more!
            </p>

            <div className="example-questions">
              <p className="example-label">Try asking:</p>
              {exampleQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => setInput(question)}
                  className="example-btn"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.role === "assistant" ? (
                    <div className="assistant-message">
                      <div className="markdown-content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="sources">
                          <button
                            onClick={() => toggleSources(index)}
                            className="sources-toggle"
                          >
                            📚 {message.sources.length} Sources
                            {showSources[index] ? " ▼" : " ►"}
                          </button>

                          {showSources[index] && (
                            <div className="sources-list">
                              {message.sources.map((source, i) => (
                                <div key={i} className="source-item">
                                  <div className="source-header">
                                    <strong>{source.title}</strong>
                                    <span className="source-score">
                                      {(source.score * 100).toFixed(0)}% match
                                    </span>
                                  </div>
                                  {source.url && (
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="source-link"
                                    >
                                      <ExternalLink size={14} />
                                      {source.url}
                                    </a>
                                  )}
                                  {source.excerpt && (
                                    <p className="source-excerpt">
                                      {source.excerpt}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="message-actions">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="action-btn"
                          title="Copy"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="user-message">{message.content}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="loading">
                    <Loader2 className="spinner" size={20} />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="input-area">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about Stripe..."
            className="message-input"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="send-btn"
          >
            {loading ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}

export default App;
