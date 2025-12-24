// src/pages/DashboardPage.jsx
// Main dashboard showing system overview and statistics

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Boxes,
  Database,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Loading } from "../components/common/Loading";
import { Badge } from "../components/common/Badge";
import { fetchDocuments } from "../store/slices/documentSlice";
import { fetchChunkStats } from "../store/slices/chunkSlice";
import { fetchVectorStats } from "../store/slices/searchSlice";

const StatsCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "primary",
}) => {
  const colors = {
    primary:
      "from-primary-50 to-primary-100 border-primary-200 text-primary-600",
    green: "from-green-50 to-green-100 border-green-200 text-green-600",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-600",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-600",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 border`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white`}>
          <Icon className={`w-6 h-6 ${colors[color].split(" ")[3]}`} />
        </div>
        {subtitle && <span className="text-sm font-medium">{subtitle}</span>}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
};

export const DashboardPage = () => {
  const dispatch = useDispatch();

  const documents = useSelector((state) => state.documents.documents);
  const chunkStats = useSelector((state) => state.chunks.stats);
  const vectorStats = useSelector((state) => state.search.vectorStats);
  const loading = useSelector(
    (state) =>
      state.documents.loading || state.chunks.loading || state.search.loading
  );

  useEffect(() => {
    // Fetch all dashboard data on mount
    dispatch(fetchDocuments());
    dispatch(fetchChunkStats());
    dispatch(fetchVectorStats());
  }, [dispatch]);

  // Calculate additional stats
  const totalDocuments = documents.length;
  const processedDocuments = documents.filter(
    (d) => d.status === "processed"
  ).length;
  const pendingDocuments = documents.filter(
    (d) => d.status === "pending"
  ).length;
  const recentDocuments = documents.slice(0, 5);

  if (loading && documents.length === 0) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your Stripe documentation RAG system
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={FileText}
          title="Total Documents"
          value={totalDocuments}
          subtitle={`${pendingDocuments} pending`}
          color="primary"
        />

        <StatsCard
          icon={Boxes}
          title="Total Chunks"
          value={chunkStats.total || 0}
          subtitle={`${chunkStats.pending || 0} pending`}
          color="green"
        />

        <StatsCard
          icon={Database}
          title="Vectors Stored"
          value={vectorStats.totalVectors || 0}
          subtitle={`${chunkStats.embedded || 0} embedded`}
          color="blue"
        />

        <StatsCard
          icon={TrendingUp}
          title="Processed"
          value={processedDocuments}
          subtitle={`${(
            (processedDocuments / totalDocuments) * 100 || 0
          ).toFixed(0)}%`}
          color="purple"
        />
      </div>

      {/* System Status */}
      <Card title="System Status">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="font-semibold text-green-600">Connected</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vector DB</p>
              <p className="font-semibold text-green-600">Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Embeddings</p>
              <p className="font-semibold text-green-600">Ready</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Documents */}
      <Card
        title="Recent Documents"
        actions={
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </button>
        }
      >
        {recentDocuments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No documents scraped yet. Start by adding URLs to scrape.
          </p>
        ) : (
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{doc.title}</h4>
                  <p className="text-sm text-gray-600 truncate">{doc.url}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      doc.status === "processed"
                        ? "success"
                        : doc.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {doc.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {doc.wordCount} words
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Processing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Chunking Progress">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold">{chunkStats.pending || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (chunkStats.pending / chunkStats.total) * 100 || 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Embedded</span>
                <span className="font-semibold">
                  {chunkStats.embedded || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (chunkStats.embedded / chunkStats.total) * 100 || 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Document Status">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Processed</span>
              </div>
              <span className="font-semibold">{processedDocuments}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-semibold">{pendingDocuments}</span>
            </div>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <button className="w-full btn-primary text-left">
              Add New URLs
            </button>
            <button className="w-full btn-secondary text-left">
              Process Pending
            </button>
            <button className="w-full btn-secondary text-left">
              View Statistics
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
