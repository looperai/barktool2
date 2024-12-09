export interface BuildUpItem {
  id: string;
  itemName: string;
  material: string;
  thickness: number;
  mass: number;
  a1a3IncBiogenic: number;
  a1a3Biogenic: number;
}

export interface SavedBuildUp {
  id: string;
  name: string;
  totalThickness: number;
  totalMass: number;
  totalA1A3IncBiogenic: number;
  totalA1A3Biogenic: number;
  items: BuildUpItem[];
} 