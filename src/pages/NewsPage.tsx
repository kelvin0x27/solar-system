import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSpaceNews } from '@/lib/api';

export default function NewsPage() {
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ['news', offset],
    queryFn: () => fetchSpaceNews(LIMIT, offset),
    staleTime: 1000 * 60 * 5,
  });

  const articles = data?.results || [];
  const hasNext = !!data?.next;
  const hasPrev = offset > 0;

  return (
    <div className='w-full h-full overflow-y-auto pt-32 pb-8 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-6'>
          <h1 className='font-display text-3xl font-bold gradient-text mb-1'>
            📰 Tin Tức Vũ Trụ
          </h1>
          <p className='text-sm text-text-secondary'>
            Latest from Spaceflight News API
          </p>
        </div>

        {isLoading && (
          <div className='glass p-12 flex items-center justify-center'>
            <div className='w-8 h-8 border-2 border-glass-border border-t-accent-blue rounded-full animate-spin' />
          </div>
        )}

        {error && (
          <div className='glass p-8 text-center text-accent-coral'>
            Không thể tải tin tức.
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {articles.map((article: any, i: number) => (
            <a
              key={article.id}
              href={article.url}
              target='_blank'
              rel='noopener noreferrer'
              className='glass overflow-hidden group cursor-pointer hover:border-accent-blue/30 transition-all animate-fade-in-up'
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {article.image_url && (
                <div className='relative pt-[56.25%] overflow-hidden'>
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className='absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    loading='lazy'
                  />
                </div>
              )}
              <div className='p-4'>
                <h3 className='font-display font-semibold text-sm mb-2 line-clamp-2 group-hover:text-accent-blue transition-colors'>
                  {article.title}
                </h3>
                <p className='text-xs text-text-secondary line-clamp-3 mb-3'>
                  {article.summary}
                </p>
                <div className='flex items-center justify-between text-[10px] text-text-muted'>
                  <span>{article.news_site}</span>
                  <span>
                    {new Date(article.published_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Pagination */}
        <div className='flex justify-center gap-3 mt-6'>
          <button
            disabled={!hasPrev}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            className='px-4 py-2 text-sm glass rounded-xl disabled:opacity-30 hover:bg-glass-hover transition-all disabled:cursor-not-allowed'
          >
            ← Trước
          </button>
          <button
            disabled={!hasNext}
            onClick={() => setOffset(offset + LIMIT)}
            className='px-4 py-2 text-sm glass rounded-xl disabled:opacity-30 hover:bg-glass-hover transition-all disabled:cursor-not-allowed'
          >
            Tiếp →
          </button>
        </div>
      </div>
    </div>
  );
}
