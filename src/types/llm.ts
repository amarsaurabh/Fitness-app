export type LLMCallType =
  | 'fridge_meals'
  | 'weekly_review'
  | 'motivation'
  | 'workout_modifier';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  max_tokens: number;
  temperature: number;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface MealSuggestion {
  name: string;
  ingredients: string[];
  proteinG: number;
  carbsG: number;
  fatG: number;
  instructions: string;
}

export interface ModifiedExercise {
  name: string;
  reason: string;
}
