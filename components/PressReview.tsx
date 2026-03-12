
import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, BarChart3, Factory, ShoppingBag } from 'lucide-react';
import Button from './Button';
import { fetchNewsFeed } from '../services/geminiService';
import { NewsArticle } from '../types';

const PressReview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchNewsFeed();
      setData(result);
    } catch (err: any) {
      setError("Không thể tải tin tức. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Newspaper className="text-primary-600" />
            Bản tin Thông minh Gemini
          </h2>
          <p className="text-sm text-gray-500">Tự động tổng hợp và phân tích thị trường giày da, túi xách & kinh tế</p>
        </div>
        <Button onClick={loadNews} isLoading={isLoading} variant="secondary" icon={<RefreshCw size={16} />}>
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Đang quét Google Search & Phân tích dữ liệu...</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main News Stream */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-2">
              <Factory size={18} className="text-orange-500" />
              Tiêu điểm Sản xuất & Thời trang
            </h3>
            {data.data.articles.map((article: NewsArticle, idx: number) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">{article.category}</span>
                  {article.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                  {article.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
                  {article.trend === 'stable' && <Minus size={16} className="text-gray-400" />}
                </div>
                <h4 className="font-bold text-gray-900 mb-2 leading-tight hover:text-primary-600 cursor-pointer">{article.title}</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{article.summary}</p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                  <span className="text-xs font-medium text-gray-400">Nguồn: {article.source}</span>
                  <a href={article.url} target="_blank" rel="noreferrer" className="text-primary-600 flex items-center gap-1 text-xs font-bold hover:underline">
                    Xem chi tiết <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Market Stats & Trends */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
                Chỉ số Thị trường
              </h3>
              <div className="space-y-4">
                {data.data.market_stats?.map((stat: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{stat.value}</div>
                      <div className={`text-[10px] font-bold ${stat.change.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag size={20} />
                <h3 className="font-bold">Xu hướng Giày da</h3>
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Thị trường túi xách & giày dép Việt Nam đang chuyển dịch mạnh sang nguyên liệu bền vững (Eco-friendly). Các đơn hàng từ EU đang yêu cầu cao về chứng chỉ xanh.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-[10px] mb-1">
                  <span>Nhu cầu nội địa</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white h-1.5 rounded-full" style={{width: '78%'}}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : null}

      {/* Sources links */}
      {data?.sources && (
        <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-400">
          <p className="font-bold mb-2">Trích dẫn nguồn:</p>
          <div className="flex flex-wrap gap-4">
            {data.sources.slice(0, 5).map((chunk: any, i: number) => (
              <a key={i} href={chunk.web?.uri} target="_blank" className="hover:text-primary-600 underline truncate max-w-xs">
                {chunk.web?.title || 'Tài liệu nguồn'}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PressReview;
