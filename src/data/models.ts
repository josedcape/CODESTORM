import { AIModel } from '../types';
import { Brain, Code2, TestTube } from 'lucide-react';

export const availableModels: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4O',
    description: 'Specialized in architecture, system design, and complex algorithms',
    strengths: ['System Architecture', 'Complex Algorithms', 'Design Patterns'],
    icon: Brain.toString()
  },
  {
    id: 'gpt-o3-mini',
    name: 'GPT-O3 Mini',
    description: 'Focused on code implementation, optimization, and debugging',
    strengths: ['Code Implementation', 'Optimization', 'Debugging'],
    icon: Code2.toString()
  },
  {
    id: 'gemini-2.5',
    name: 'Gemini 2.5',
    description: 'Excels at testing, documentation, and multimedia features',
    strengths: ['Testing', 'Documentation', 'Multimedia Integration'],
    icon: TestTube.toString()
  }
];