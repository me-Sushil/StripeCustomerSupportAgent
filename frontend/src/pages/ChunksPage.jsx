

// ============================================
// src/pages/ChunksPage.jsx
// ============================================

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Boxes, FileText, AlertCircle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Loading } from '../components/common/Loading';
import { 
  fetchChunkStats,
  chunkAllDocuments,
  selectChunkStats,
  selectChunksLoading,
  selectChunking
} from '../store/slices/chunkSlice';
import toast from 'react-hot-toast';

export const ChunksPage = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectChunkStats);
  const loading = useSelector(selectChunksLoading);
  const chunking = useSelector(selectChunking);

  useEffect(() => {
    dispatch(fetchChunkStats());
  }, [dispatch]);

  const handleChunkAll = async () => {
    const result = await dispatch(chunkAllDocuments());
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Chunking completed!');
      dispatch(fetchChunkStats());
    }
  };

  if (loading) {
    return <Loading message="Loading chunk statistics..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Chunks</h1>
          <p className="text-gray-600 mt-1">
            View and manage text chunks for embedding
          </p>
        </div>
        <Button
          onClick={handleChunkAll}
          loading={chunking}
          icon={Boxes}
        >
          Chunk All Pending
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Chunks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.total || 0}
              </p>
            </div>
            <Boxes className="w-12 h-12 text-primary-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.pending || 0}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Embedded</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.embedded || 0}
              </p>
            </div>
            <FileText className="w-12 h-12 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats.failed || 0}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Progress Visualization */}
      <Card title="Processing Progress">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Embedding Progress</span>
              <span className="text-gray-600">
                {stats.embedded}/{stats.total} ({((stats.embedded / stats.total) * 100 || 0).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-primary-600 to-primary-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(stats.embedded / stats.total) * 100 || 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-gray-900">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{stats.pending || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-gray-900">Embedded</p>
                <p className="text-lg font-bold text-green-600">{stats.embedded || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-gray-900">Failed</p>
                <p className="text-lg font-bold text-red-600">{stats.failed || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="What are Chunks?">
          <p className="text-gray-700 leading-relaxed">
            Documents are split into smaller chunks to improve embedding quality and search accuracy. 
            Each chunk typically contains 1000 characters with 200 characters overlap to maintain context.
          </p>
        </Card>

        <Card title="Next Steps">
          <div className="space-y-3">
            {stats.pending > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Pending Chunks</p>
                  <p className="text-sm text-gray-600">
                    You have {stats.pending} chunks ready for embedding. 
                    Go to Pipeline to process them.
                  </p>
                </div>
              </div>
            )}
            
            {stats.pending === 0 && stats.total > 0 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">All Set!</p>
                  <p className="text-sm text-gray-600">
                    All chunks are processed. You can now search the documentation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
