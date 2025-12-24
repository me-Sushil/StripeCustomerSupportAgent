// ============================================
// src/pages/ScraperPage.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Loading } from '../components/common/Loading';
import { 
  scrapeUrl, 
  scrapeBatch, 
  fetchDocuments,
  selectAllDocuments,
  selectScraping,
  selectDocumentsLoading
} from '../store/slices/documentSlice';
import toast from 'react-hot-toast';

export const ScraperPage = () => {
  const dispatch = useDispatch();
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [usePuppeteer, setUsePuppeteer] = useState(false);
  
  const documents = useSelector(selectAllDocuments);
  const scraping = useSelector(selectScraping);
  const loading = useSelector(selectDocumentsLoading);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const handleScrapeSingle = async () => {
    if (!singleUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    const result = await dispatch(scrapeUrl({ url: singleUrl, usePuppeteer }));
    if (result.type.endsWith('/fulfilled')) {
      toast.success('URL scraped successfully!');
      setSingleUrl('');
      dispatch(fetchDocuments());
    }
  };

  const handleScrapeBatch = async () => {
    const urls = batchUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urls.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }
    
    const result = await dispatch(scrapeBatch({ urls, usePuppeteer }));
    if (result.type.endsWith('/fulfilled')) {
      toast.success(`Batch scraping completed!`);
      setBatchUrls('');
      dispatch(fetchDocuments());
    }
  };

  const presetUrls = [
    'https://stripe.com/docs/api',
    'https://stripe.com/docs/payments',
    'https://stripe.com/docs/billing',
    'https://stripe.com/docs/connect',
    'https://stripe.com/docs/webhooks'
  ];

  const loadPresets = () => {
    setBatchUrls(presetUrls.join('\n'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Web Scraper</h1>
          <p className="text-gray-600 mt-1">Scrape Stripe documentation URLs</p>
        </div>
        <Button onClick={() => dispatch(fetchDocuments())} variant="secondary">
          Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single URL Scraper */}
        <Card title="Scrape Single URL">
          <div className="space-y-4">
            <Input
              label="URL"
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://stripe.com/docs/api"
              icon={LinkIcon}
            />
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="puppeteer-single"
                checked={usePuppeteer}
                onChange={(e) => setUsePuppeteer(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="puppeteer-single" className="text-sm text-gray-700">
                Use Puppeteer (for JavaScript-heavy pages)
              </label>
            </div>
            
            <Button
              onClick={handleScrapeSingle}
              loading={scraping}
              icon={Plus}
              className="w-full"
            >
              Scrape URL
            </Button>
          </div>
        </Card>

        {/* Batch URL Scraper */}
        <Card title="Scrape Multiple URLs">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URLs (one per line)
              </label>
              <textarea
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                placeholder="https://stripe.com/docs/api&#10;https://stripe.com/docs/payments"
                className="textarea-field"
                rows={5}
              />
            </div>
            
            <Button onClick={loadPresets} variant="secondary" size="sm">
              Load Preset URLs
            </Button>
            
            <Button
              onClick={handleScrapeBatch}
              loading={scraping}
              icon={Plus}
              className="w-full"
            >
              Scrape Batch
            </Button>
          </div>
        </Card>
      </div>

      {/* Documents List */}
      <Card title={`Scraped Documents (${documents.length})`}>
        {loading && documents.length === 0 ? (
          <Loading message="Loading documents..." />
        ) : documents.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No documents yet. Start by scraping URLs above.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                  <p className="text-sm text-gray-600 truncate">{doc.url}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">{doc.wordCount} words</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(doc.scrapedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge variant={
                  doc.status === 'processed' ? 'success' :
                  doc.status === 'pending' ? 'warning' : 'danger'
                }>
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
