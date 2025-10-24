
export interface FoodItem {
  name: string;
  calories: number;
}

export interface AnalysisResult {
  totalCalories: number;
  items: FoodItem[];
}
