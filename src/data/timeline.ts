export interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  emoji: string;
  category: 'milestone' | 'mission' | 'discovery' | 'technology';
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    year: 1957,
    title: 'Sputnik 1',
    description:
      'Vệ tinh nhân tạo đầu tiên được phóng bởi Liên Xô, mở ra kỷ nguyên vũ trụ.',
    emoji: '🛰️',
    category: 'milestone',
  },
  {
    year: 1961,
    title: 'Yuri Gagarin bay vào vũ trụ',
    description:
      'Con người đầu tiên bay vào không gian, hoàn thành 1 vòng quanh Trái Đất.',
    emoji: '👨‍🚀',
    category: 'milestone',
  },
  {
    year: 1969,
    title: 'Apollo 11 — Đặt chân lên Mặt Trăng',
    description:
      'Neil Armstrong trở thành người đầu tiên đặt chân lên Mặt Trăng.',
    emoji: '🌙',
    category: 'milestone',
  },
  {
    year: 1971,
    title: 'Trạm Salyut 1',
    description:
      'Trạm vũ trụ đầu tiên trong lịch sử, được Liên Xô phóng lên quỹ đạo.',
    emoji: '🏗️',
    category: 'technology',
  },
  {
    year: 1977,
    title: 'Voyager 1 & 2 khởi hành',
    description:
      'Hai tàu thăm dò bay qua tất cả các hành tinh ngoài, nay đã ra khỏi hệ mặt trời.',
    emoji: '🚀',
    category: 'mission',
  },
  {
    year: 1981,
    title: 'Tàu con thoi đầu tiên (Columbia)',
    description: 'NASA phóng tàu con thoi tái sử dụng đầu tiên.',
    emoji: '🛸',
    category: 'technology',
  },
  {
    year: 1990,
    title: 'Kính viễn vọng Hubble',
    description:
      'Kính Hubble được đưa lên quỹ đạo, mở ra cửa sổ mới để quan sát vũ trụ.',
    emoji: '🔭',
    category: 'technology',
  },
  {
    year: 1997,
    title: 'Mars Pathfinder & Sojourner',
    description: 'Robot tự hành đầu tiên khám phá bề mặt Sao Hoả.',
    emoji: '🤖',
    category: 'mission',
  },
  {
    year: 1998,
    title: 'Trạm ISS bắt đầu xây dựng',
    description:
      'Modul đầu tiên của ISS được phóng, bắt đầu dự án hợp tác quốc tế lớn nhất.',
    emoji: '🛸',
    category: 'technology',
  },
  {
    year: 2004,
    title: 'Spirit & Opportunity trên Sao Hoả',
    description:
      'Hai robot thám hiểm tìm bằng chứng nước từng tồn tại trên Sao Hoả.',
    emoji: '🔴',
    category: 'mission',
  },
  {
    year: 2006,
    title: 'New Horizons khởi hành đến Pluto',
    description:
      'Tàu sẽ mất 9 năm để đến Sao Diêm Vương, gửi về ảnh chưa từng có.',
    emoji: '🧊',
    category: 'mission',
  },
  {
    year: 2012,
    title: 'Curiosity đáp xuống Sao Hoả',
    description:
      'Robot lớn nhất từng đáp xuống hành tinh khác, vẫn hoạt động đến nay.',
    emoji: '🔬',
    category: 'mission',
  },
  {
    year: 2015,
    title: 'New Horizons bay qua Pluto',
    description:
      'Ảnh cận cảnh đầu tiên của Pluto tiết lộ hình trái tim băng nổi tiếng.',
    emoji: '❄️',
    category: 'discovery',
  },
  {
    year: 2019,
    title: 'Ảnh hố đen đầu tiên',
    description:
      'Event Horizon Telescope chụp ảnh hố đen M87*, khoảnh khắc lịch sử.',
    emoji: '🕳️',
    category: 'discovery',
  },
  {
    year: 2020,
    title: 'SpaceX Crew Dragon',
    description:
      'SpaceX đưa phi hành gia NASA lên ISS, mở ra kỷ nguyên du hành tư nhân.',
    emoji: '🐉',
    category: 'technology',
  },
  {
    year: 2021,
    title: 'Perseverance & Ingenuity',
    description:
      'Robot + trực thăng đầu tiên trên Sao Hoả, tìm kiếm dấu hiệu sự sống cổ.',
    emoji: '🚁',
    category: 'mission',
  },
  {
    year: 2021,
    title: 'Kính James Webb (JWST)',
    description:
      'Kính viễn vọng mạnh nhất từng được xây, nhìn ngược 13.5 tỷ năm.',
    emoji: '✨',
    category: 'technology',
  },
  {
    year: 2024,
    title: 'Artemis — Quay lại Mặt Trăng',
    description:
      'Chương trình Artemis hướng đến đưa con người trở lại Mặt Trăng.',
    emoji: '🌙',
    category: 'milestone',
  },
];
