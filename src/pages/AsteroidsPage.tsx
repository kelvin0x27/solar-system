import { useQuery } from '@tanstack/react-query';
import { fetchNeoFeed } from '@/lib/api';
import { getToday, getDaysAgo } from '@/lib/utils';

export default function AsteroidsPage() {
  const startDate = getDaysAgo(7);
  const endDate = getToday();

  const { data, isLoading, error } = useQuery({
    queryKey: ['neo', startDate, endDate],
    queryFn: () => fetchNeoFeed(startDate, endDate),
    staleTime: 1000 * 60 * 30,
  });

  const asteroids: any[] = data
    ? Object.values(data.near_earth_objects || {}).flat()
    : [];
  const sorted = asteroids
    .sort((a: any, b: any) => {
      const distA = parseFloat(
        a.close_approach_data?.[0]?.miss_distance?.kilometers || '0',
      );
      const distB = parseFloat(
        b.close_approach_data?.[0]?.miss_distance?.kilometers || '0',
      );
      return distA - distB;
    })
    .slice(0, 30);

  return (
    <div className='w-full h-full overflow-y-auto pt-32 pb-8 px-4 md:px-8'>
      <div className='max-w-5xl mx-auto'>
        <div className='mb-6'>
          <h1 className='font-display text-3xl font-bold gradient-text mb-1'>
            ☄️ Tiểu Hành Tinh Gần Trái Đất
          </h1>
          <p className='text-sm text-text-secondary'>
            Near-Earth Objects trong 7 ngày qua · NASA NeoWs API
          </p>
        </div>

        {data && (
          <div className='glass p-4 mb-6 flex flex-wrap gap-4'>
            <div className='flex-1 min-w-[120px]'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider'>
                Tổng phát hiện
              </div>
              <div className='font-display text-2xl font-bold text-accent-cyan'>
                {data.element_count || 0}
              </div>
            </div>
            <div className='flex-1 min-w-[120px]'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider'>
                Nguy hiểm tiềm ẩn
              </div>
              <div className='font-display text-2xl font-bold text-accent-coral'>
                {
                  asteroids.filter(
                    (a: any) => a.is_potentially_hazardous_asteroid,
                  ).length
                }
              </div>
            </div>
            <div className='flex-1 min-w-[120px]'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider'>
                Khoảng thời gian
              </div>
              <div className='font-display text-sm font-semibold text-text-primary'>
                {startDate} → {endDate}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className='glass p-12 flex items-center justify-center'>
            <div className='w-8 h-8 border-2 border-glass-border border-t-accent-blue rounded-full animate-spin' />
          </div>
        )}

        {error && (
          <div className='glass p-8 text-center text-accent-coral'>
            Không thể tải dữ liệu tiểu hành tinh.
          </div>
        )}

        <div className='grid gap-3'>
          {sorted.map((neo: any, i: number) => {
            const approach = neo.close_approach_data?.[0];
            const diameter = neo.estimated_diameter?.kilometers;
            const isHazardous = neo.is_potentially_hazardous_asteroid;
            return (
              <div
                key={neo.id}
                className='glass p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in-up'
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                  <span
                    className={`text-lg ${isHazardous ? 'animate-pulse-glow' : ''}`}
                  >
                    {isHazardous ? '⚠️' : '🪨'}
                  </span>
                  <div className='min-w-0'>
                    <p className='font-display font-semibold text-sm truncate'>
                      {neo.name}
                    </p>
                    <p className='text-[11px] text-text-muted'>
                      {approach?.close_approach_date || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className='flex gap-4 text-xs'>
                  <div>
                    <span className='text-text-muted'>Đường kính: </span>
                    <span className='font-semibold'>
                      {diameter
                        ? `${diameter.estimated_diameter_min.toFixed(2)}–${diameter.estimated_diameter_max.toFixed(2)} km`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className='text-text-muted'>Khoảng cách: </span>
                    <span className='font-semibold'>
                      {approach
                        ? `${parseFloat(approach.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className='text-text-muted'>Vận tốc: </span>
                    <span className='font-semibold'>
                      {approach
                        ? `${parseFloat(approach.relative_velocity.kilometers_per_hour).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                {isHazardous && (
                  <span className='px-2 py-0.5 text-[10px] font-semibold bg-accent-coral/15 text-accent-coral border border-accent-coral/25 rounded-full shrink-0'>
                    NGUY HIỂM
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
