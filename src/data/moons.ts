export interface MoonData {
  id: string;
  name: string;
  parentId: string;
  diameter: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: number;
  sceneRadius: number;
  facts: string[];
}

export const MOONS: MoonData[] = [
  {
    id: 'moon',
    name: 'Mặt Trăng',
    parentId: 'earth',
    diameter: 3474,
    orbitRadius: 3,
    orbitSpeed: 0.02,
    color: 0xaaaaaa,
    sceneRadius: 0.35,
    facts: [
      'Thiên thể tự nhiên duy nhất của Trái Đất.',
      '12 người đã đặt chân lên Mặt Trăng.',
      'Ảnh hưởng đến thuỷ triều Trái Đất.',
    ],
  },
  {
    id: 'io',
    name: 'Io',
    parentId: 'jupiter',
    diameter: 3643,
    orbitRadius: 5.5,
    orbitSpeed: 0.025,
    color: 0xe8c44a,
    sceneRadius: 0.3,
    facts: [
      'Thiên thể hoạt động núi lửa mạnh nhất.',
      'Hơn 400 núi lửa đang hoạt động.',
      'Bề mặt liên tục thay đổi do dung nham.',
    ],
  },
  {
    id: 'europa',
    name: 'Europa',
    parentId: 'jupiter',
    diameter: 3122,
    orbitRadius: 7,
    orbitSpeed: 0.02,
    color: 0xc8d0d8,
    sceneRadius: 0.28,
    facts: [
      'Có đại dương nước lỏng dưới lớp băng.',
      'Ứng viên tiềm năng cho sự sống ngoài TĐ.',
      'Bề mặt băng mịn nhất trong hệ MT.',
    ],
  },
  {
    id: 'ganymede',
    name: 'Ganymede',
    parentId: 'jupiter',
    diameter: 5268,
    orbitRadius: 9,
    orbitSpeed: 0.015,
    color: 0x9a8a7a,
    sceneRadius: 0.35,
    facts: [
      'Vệ tinh lớn nhất hệ mặt trời.',
      'Lớn hơn cả Sao Thuỷ.',
      'Có từ trường riêng.',
    ],
  },
  {
    id: 'callisto',
    name: 'Callisto',
    parentId: 'jupiter',
    diameter: 4821,
    orbitRadius: 11,
    orbitSpeed: 0.012,
    color: 0x6a6a5a,
    sceneRadius: 0.33,
    facts: [
      'Bề mặt cổ nhất, đầy hố va chạm.',
      'Có thể có đại dương ngầm.',
      'Ít bị ảnh hưởng bởi bức xạ Sao Mộc.',
    ],
  },
  {
    id: 'titan',
    name: 'Titan',
    parentId: 'saturn',
    diameter: 5150,
    orbitRadius: 6,
    orbitSpeed: 0.018,
    color: 0xdaa520,
    sceneRadius: 0.35,
    facts: [
      'Bầu khí quyển dày, duy nhất trong các vệ tinh.',
      'Có hồ và sông hydrocarbon lỏng.',
      'Tàu Huygens đáp xuống năm 2005.',
    ],
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    parentId: 'saturn',
    diameter: 504,
    orbitRadius: 4,
    orbitSpeed: 0.025,
    color: 0xffffff,
    sceneRadius: 0.15,
    facts: [
      'Phun nước từ cực Nam.',
      'Có đại dương nước ấm bên dưới.',
      'Ứng viên tiềm năng cho sự sống.',
    ],
  },
  {
    id: 'triton',
    name: 'Triton',
    parentId: 'neptune',
    diameter: 2707,
    orbitRadius: 4,
    orbitSpeed: 0.02,
    color: 0x8899aa,
    sceneRadius: 0.25,
    facts: [
      'Quay ngược chiều (retrograde).',
      'Có thể bị bắt từ vành đai Kuiper.',
      'Có hoạt động phun băng nitơ.',
    ],
  },
];
