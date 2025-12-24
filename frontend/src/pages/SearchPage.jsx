// src/pages/SearchPage.jsx
// Semantic search interface for querying the documentation

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  ExternalLink,
  Copy,
  ThumbsUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Loading } from "../components/common/Loading";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import {
  performSearch,
  selectSearchResults,
  selectSearchLoading,
  selectCurrentQuery,
  selectSearchHistory,
} from "../store/slices/searchSlice";
import toast from "react-hot-toast";

const SearchResult = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.chunkText);
    toast.success("Copied to clipboard!");
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">#{index + 1}</Badge>
              <Badge variant="success">
                {(result.score * 100).toFixed(1)}% match
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {result.metadata?.sourceTitle ||
                result.source?.title ||
                "Untitled"}
            </h3>
            {result.source?.url && (
              <a
                href={result.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline flex items-center gap-1 mt-1"
              >
                {result.source.url}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy text"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Helpful"
            >
              <ThumbsUp className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <p
            className={`text-gray-700 leading-relaxed ${
              !expanded && "line-clamp-3"
            }`}
          >
            {result.chunkText}
          </p>
          {result.chunkText.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
          <span>Chunk {result.metadata?.chunkIndex + 1}</span>
          <span>•</span>
          <span>{result.chunkText.length} characters</span>
        </div>
      </div>
    </Card>
  );
};

export const SearchPage = () => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);

  const results = useSelector(selectSearchResults);
  const loading = useSelector(selectSearchLoading);
  const currentQuery = useSelector(selectCurrentQuery);
  const searchHistory = useSelector(selectSearchHistory);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    dispatch(performSearch({ query: query.trim(), topK }));
  };

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    dispatch(performSearch({ query: historyQuery, topK }));
  };

  const exampleQueries = [
    "How do I create a payment intent?",
    "What is the difference between payment intent and charge?",
    "How to handle webhook events?",
    "How do I set up recurring billing?",
    "What are the Stripe test card numbers?",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Search Documentation
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Ask questions about Stripe API and get instant, accurate answers from
          our knowledge base
        </p>
      </div>

      {/* Search Form */}
      <Card className="max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about Stripe... (e.g., How to create a payment intent?)"
              className="w-full px-6 py-4 pr-24 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
              <Button
                type="submit"
                loading={loading}
                icon={Search}
                className="!py-2"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Example queries */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Try:</span>
            {exampleQueries.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(example)}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search History Sidebar */}
        <div className="lg:col-span-1">
          <Card title="Recent Searches">
            {searchHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No search history yet
              </p>
            ) : (
              <div className="space-y-2">
                {searchHistory.slice(0, 10).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleHistoryClick(item.query)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 truncate group-hover:text-primary-600">
                          {item.query}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.resultCount} results
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <Loading message="Searching documentation..." />
          ) : results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Found {results.length} results for "{currentQuery}"
                </h2>
              </div>

              <div className="space-y-4">
                {results.map((result, index) => (
                  <SearchResult key={index} result={result} index={index} />
                ))}
              </div>
            </>
          ) : currentQuery ? (
            <EmptyState
              icon={Search}
              title="No results found"
              description={`We couldn't find any results for "${currentQuery}". Try rephrasing your question or using different keywords.`}
              action={
                <Button onClick={() => setQuery("")}>Clear Search</Button>
              }
            />
          ) : (
            <EmptyState
              icon={Search}
              title="Start Searching"
              description="Enter your question above to search through Stripe documentation using semantic search powered by AI."
            />
          )}
        </div>
      </div>
    </div>
  );
};
