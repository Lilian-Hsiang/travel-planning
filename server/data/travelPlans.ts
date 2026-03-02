export type TravelPlan = {
  id: string
  date: string
  time: string
  location: string
  mapUrl: string
  image: string
  note: string
}

export const travelPlans: TravelPlan[] = [
  {
    id: 'plan-001',
    date: '2026-03-15',
    time: '09:30',
    location: '清境農場',
    mapUrl: 'https://maps.google.com/?q=24.0476,121.1614',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    note: '先在青青草原拍照，再到觀景步道散步。'
  },
  {
    id: 'plan-002',
    date: '2026-03-16',
    time: '14:00',
    location: '日月潭向山遊客中心',
    mapUrl: 'https://maps.google.com/?q=23.8627,120.9158',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    note: '租自行車環潭，結束後搭船到伊達邵。'
  },
  {
    id: 'plan-003',
    date: '2026-03-17',
    time: '18:30',
    location: '台中審計新村夜市',
    mapUrl: 'https://maps.google.com/?q=24.1457,120.6637',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
    note: '品嚐在地小吃，順路逛周邊文創小店。'
  }
]
