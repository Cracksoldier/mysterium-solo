export type Category = 'suspect' | 'location' | 'weapon';

export interface EvidenceCard {
  id: string;
  category: Category;
  name: string;
  description: string;
  tags: string[];
}

export interface VisionCard {
  id: string;
  title: string;
  scene: string;
  tags: string[];
}
