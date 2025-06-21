import { AIModel } from '../types';
import { Brain, Code2, TestTube, Zap, Bot, Sparkles } from 'lucide-react';

export const availableModels: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4O',
    description: 'Especializado en arquitectura, diseño de sistemas y algoritmos complejos',
    strengths: ['Arquitectura de Sistemas', 'Algoritmos Complejos', 'Patrones de Diseño'],
    icon: 'Brain'
  },
  {
    id: 'gpt-o3-mini',
    name: 'GPT-O3 Mini',
    description: 'Enfocado en implementación de código, optimización y depuración',
    strengths: ['Implementación de Código', 'Optimización', 'Depuración'],
    icon: 'Code2'
  },
  {
    id: 'claude-3.7',
    name: 'Claude 3.7',
    description: 'Excelente para razonamiento, explicaciones detalladas y análisis de código',
    strengths: ['Razonamiento', 'Explicaciones Detalladas', 'Análisis de Código'],
    icon: 'Bot'
  },
  {
    id: 'claude-3.5-sonnet-v2',
    name: 'Claude 3.5 Sonnet V2',
    description: 'Equilibrio entre rendimiento y eficiencia para tareas de desarrollo generales',
    strengths: ['Versatilidad', 'Eficiencia', 'Desarrollo General'],
    icon: 'Sparkles'
  },

];
