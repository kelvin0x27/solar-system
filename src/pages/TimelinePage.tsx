import { TIMELINE_EVENTS } from '@/data/timeline';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  milestone: 'bg-accent-gold/15 text-accent-gold border-accent-gold/20',
  mission: 'bg-accent-blue/15 text-accent-blue border-accent-blue/20',
  discovery: 'bg-accent-purple/15 text-accent-purple border-accent-purple/20',
  technology: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/20',
};
const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Cột mốc',
  mission: 'Sứ mệnh',
  discovery: 'Khám phá',
  technology: 'Công nghệ',
};

export default function TimelinePage() {
  return (
    <div className='w-full h-full overflow-y-auto pt-32 pb-8 px-4 md:px-8'>
      <div className='max-w-3xl mx-auto'>
        <div className='mb-8'>
          <h1 className='font-display text-3xl font-bold gradient-text mb-1'>
            📅 Lịch Sử Khám Phá Vũ Trụ
          </h1>
          <p className='text-sm text-text-secondary'>
            Từ Sputnik đến Artemis — hành trình vĩ đại của nhân loại
          </p>
        </div>

        <div className='relative'>
          {/* Timeline line */}
          <div className='absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-blue/30 via-accent-purple/30 to-accent-cyan/30 md:-translate-x-px' />

          {TIMELINE_EVENTS.map((event, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={i}
                className={cn(
                  'relative flex mb-8 animate-fade-in-up',
                  'md:justify-center',
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Dot */}
                <div className='absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent-blue border-2 border-deep z-10 mt-5' />

                {/* Card */}
                <div
                  className={cn(
                    'glass p-4 ml-12 md:ml-0 md:w-[45%]',
                    isLeft ? 'md:mr-auto md:pr-6' : 'md:ml-auto md:pl-6',
                  )}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-2xl'>{event.emoji}</span>
                    <span className='font-display text-2xl font-bold text-accent-cyan'>
                      {event.year}
                    </span>
                  </div>
                  <h3 className='font-display font-bold text-sm mb-1'>
                    {event.title}
                  </h3>
                  <p className='text-xs text-text-secondary leading-relaxed mb-2'>
                    {event.description}
                  </p>
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      CATEGORY_COLORS[event.category],
                    )}
                  >
                    {CATEGORY_LABELS[event.category]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
