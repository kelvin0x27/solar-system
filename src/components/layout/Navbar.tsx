import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Hệ Mặt Trời', emoji: '🪐' },
  { to: '/apod', label: 'Ảnh Vũ Trụ', emoji: '🌌' },
  { to: '/mars', label: 'Sao Hoả', emoji: '🔴' },
  { to: '/asteroids', label: 'Tiểu Hành Tinh', emoji: '☄️' },
  { to: '/overhead', label: 'Trên Đầu Tôi?', emoji: '🔭' },
  { to: '/exoplanets', label: 'Ngoại Hành Tinh', emoji: '🌍' },
  { to: '/swarm', label: 'Vệ Tinh', emoji: '🛰️' },
  { to: '/blackhole', label: 'Hố Đen', emoji: '🕳️' },
  { to: '/impact', label: 'Va Chạm', emoji: '💥' },
  { to: '/iss-view', label: 'ISS Góc nhìn 1', emoji: '🧑‍🚀' },
  { to: '/mars-map', label: 'Bản đồ Mars', emoji: '🗺️' },
  { to: '/moon', label: 'Mặt Trăng', emoji: '🌕' },
  { to: '/news', label: 'Tin Tức', emoji: '📰' },
  { to: '/timeline', label: 'Lịch Sử', emoji: '📅' },
];

export default function Navbar() {
  return (
    <nav className='fixed top-4 left-1/2 -translate-x-1/2 z-200 glass px-3 py-2 rounded-full flex items-center gap-1 max-w-[95vw] overflow-x-auto'>
      <NavLink to='/' className='flex items-center gap-1.5 px-3 py-1 shrink-0'>
        <span className='text-lg'>🪐</span>
        <span className='font-display font-bold text-sm gradient-text hidden sm:inline'>
          CosmicLearn
        </span>
      </NavLink>
      <div className='w-px h-5 bg-glass-border shrink-0 mx-1' />
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shrink-0',
              isActive
                ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/25'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5',
            )
          }
        >
          <span>{item.emoji}</span>
          <span className='hidden md:inline'>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
