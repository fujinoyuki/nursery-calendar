export * from './event'; 

export interface LocalEventFormData {
  title: string;
  description: string;
  month: string;
  duration: string;
  age_groups: AgeGroup[];
  category: Category;
  materials: string[];
  objectives: string[];
  media_files: File[];
} 