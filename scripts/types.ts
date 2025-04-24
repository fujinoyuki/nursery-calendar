export interface Event {
  id: string;
  title: string;
  description: string;
  materials: string;
  ageGroup: string;
}

export interface MonthData {
  month: number;
  name: string;
  events: Event[];
}

export interface MediaFile {
  url: string;
  type: 'image' | 'video';
  title: string;
  credit: string;
} 