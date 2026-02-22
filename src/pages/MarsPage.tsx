import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarsPhotos } from '@/lib/api';
import { getDaysAgo } from '@/lib/utils';

const CAMERAS = [
  { value: 'all', label: 'Tất cả camera' },
  { value: 'FHAZ', label: 'Front Hazard Cam' },
  { value: 'RHAZ', label: 'Rear Hazard Cam' },
  { value: 'NAVCAM', label: 'Navigation Cam' },
  { value: 'MAST', label: 'Mast Cam' },
  { value: 'CHEMCAM', label: 'Chemistry Cam' },
];

export default function MarsPage() {
  const [earthDate, setEarthDate] = useState('2024-06-15');
  const [camera, setCamera] = useState('all');
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mars', earthDate, camera],
    queryFn: () => fetchMarsPhotos(earthDate, camera),
    staleTime: 1000 * 60 * 60,
  });

  const photos = data?.photos?.slice(0, 24) || [];

  return (
    <div className='w-full h-full overflow-y-auto pt-32 pb-8 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4'>
          <div>
            <h1 className='font-display text-3xl font-bold gradient-text mb-1'>
              🔴 Ảnh từ Sao Hoả
            </h1>
            <p className='text-sm text-text-secondary'>
              Photos from NASA Curiosity Rover
            </p>
          </div>
          <div className='flex gap-2'>
            <input
              type='date'
              value={earthDate}
              onChange={(e) => setEarthDate(e.target.value)}
              className='px-3 py-2 text-sm bg-white/5 border border-glass-border rounded-xl text-text-primary focus:border-accent-blue/40 outline-none font-mono'
            />
            <select
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className='px-3 py-2 text-sm bg-white/5 border border-glass-border rounded-xl text-text-primary focus:border-accent-blue/40 outline-none'
            >
              {CAMERAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && (
          <div className='glass p-12 flex items-center justify-center'>
            <div className='w-8 h-8 border-2 border-glass-border border-t-accent-blue rounded-full animate-spin' />
          </div>
        )}

        {error && (
          <div className='glass p-8 text-center text-accent-coral'>
            Không thể tải ảnh. Thử ngày khác.
          </div>
        )}

        {!isLoading && photos.length === 0 && !error && (
          <div className='glass p-8 text-center text-text-muted'>
            Không có ảnh cho ngày này. Thử ngày khác.
          </div>
        )}

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
          {photos.map((photo: any) => (
            <div
              key={photo.id}
              onClick={() => setSelectedImg(photo.img_src)}
              className='glass overflow-hidden cursor-pointer group animate-fade-in-up'
            >
              <div className='relative pt-[100%]'>
                <img
                  src={photo.img_src.replace(/^http:\/\//i, 'https://')}
                  alt={`Mars Sol ${photo.sol}`}
                  className='absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  loading='lazy'
                />
              </div>
              <div className='p-2'>
                <p className='text-[11px] text-text-muted'>
                  Sol {photo.sol} · {photo.camera.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImg && (
          <div
            onClick={() => setSelectedImg(null)}
            className='fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-4 animate-fade-in cursor-pointer'
          >
            <img
              src={selectedImg.replace(/^http:\/\//i, 'https://')}
              alt='Mars'
              className='max-w-full max-h-full object-contain rounded-xl'
            />
          </div>
        )}
      </div>
    </div>
  );
}
