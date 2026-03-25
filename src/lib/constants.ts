export const CATEGORIES = ['Mental Health', 'Fitness', 'Nutrition', 'Lifestyle', 'Chronic Conditions'];

export const CATEGORY_INFO: Record<string, { icon: string; description: string }> = {
  'Mental Health': {
    icon: 'Brain',
    description: 'Focus on emotional well-being, stress management, and mindfulness practices.'
  },
  'Fitness': {
    icon: 'Dumbbell',
    description: 'Strength, flexibility, and cardiovascular health through movement and exercise.'
  },
  'Nutrition': {
    icon: 'Apple',
    description: 'Fueling your body with wholesome foods and understanding dietary needs.'
  },
  'Lifestyle': {
    icon: 'Sun',
    description: 'Daily habits, sleep optimization, and work-life balance for long-term health.'
  },
  'Chronic Conditions': {
    icon: 'HeartPulse',
    description: 'Support and management for long-term health journeys and specialized care.'
  }
};
