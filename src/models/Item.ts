export interface Item {
  id?: string;
  title: string;
  image?: string;
  category: "壁面" | "子供用制作物" | "イベント用" | "その他";
  content: string;
  materials: string[];
  targetAge: string;
  howToMake?: string;
  author?: string;
  month: number[];
  timestamp: Date;
  views?: number;
}