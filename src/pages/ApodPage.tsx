import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApod } from '@/lib/api';
import { getToday } from '@/lib/utils';

export default function ApodPage() {
  const [date, setDate] = useState(getToday());
  const { data, isLoading, error } = useQuery({
    queryKey: ['apod', date],
    queryFn: () => fetchApod(date),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <div className='w-full h-full overflow-y-auto pt-32 pb-8 px-4 md:px-8'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4'>
          <div>
            <h1 className='font-display text-3xl font-bold gradient-text mb-1'>
              🌌 Ảnh Vũ Trụ Mỗi Ngày
            </h1>
            <p className='text-sm text-text-secondary'>
              NASA Astronomy Picture of the Day
            </p>
          </div>
          <input
            type='date'
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
            className='px-4 py-2 text-sm bg-white/5 border border-glass-border rounded-xl text-text-primary focus:border-accent-blue/40 outline-none font-mono'
          />
        </div>

        {isLoading && (
          <div className='glass p-12 flex items-center justify-center'>
            <div className='w-8 h-8 border-2 border-glass-border border-t-accent-blue rounded-full animate-spin' />
          </div>
        )}

        {error && (
          <div className='glass p-8 text-center'>
            <p className='text-accent-coral mb-2'>Không thể tải dữ liệu</p>
            <p className='text-sm text-text-muted'>
              Vui lòng thử lại với ngày khác
            </p>
          </div>
        )}

        {data && (
          <div className='glass overflow-hidden animate-fade-in'>
            {data.media_type === 'image' ? (
              <img
                src={data.url.replace(/^http:\/\//i, 'https://')}
                alt={data.title}
                className='w-full max-h-[60vh] object-cover'
              />
            ) : (
              <div className='relative pt-[56.25%]'>
                <iframe
                  src={data.url}
                  title={data.title}
                  className='absolute inset-0 w-full h-full'
                  allowFullScreen
                />
              </div>
            )}
            <div className='p-6'>
              <h2 className='font-display text-xl font-bold mb-1'>
                {data.title}
              </h2>
              <p className='text-xs text-text-muted mb-4'>
                {data.date} {data.copyright ? `© ${data.copyright}` : ''}
              </p>
              <p className='text-sm text-text-secondary leading-relaxed'>
                {data.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
