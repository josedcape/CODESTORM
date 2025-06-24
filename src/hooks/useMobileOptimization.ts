import { useState, useEffect, useCallback } from 'react';

interface MobileOptimizationState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
  devicePixelRatio: number;
  isLowEndDevice: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

interface MobileOptimizationActions {
  triggerHapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
  optimizeForPerformance: () => boolean;
  getOptimalAnimationDuration: (baseMs: number) => number;
  shouldReduceAnimations: () => boolean;
  getOptimalImageQuality: () => 'low' | 'medium' | 'high';
  isInSafeArea: (element: HTMLElement) => boolean;
}

export const useMobileOptimization = (): MobileOptimizationState & MobileOptimizationActions => {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'landscape',
    touchDevice: false,
    devicePixelRatio: 1,
    isLowEndDevice: false,
    connectionSpeed: 'unknown'
  });

  // Detectar características del dispositivo
  const detectDevice = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 640;
    const isTablet = width > 640 && width <= 1024;
    const isDesktop = width > 1024;
    const orientation = width > height ? 'landscape' : 'portrait';
    const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Detectar dispositivos de gama baja
    const isLowEndDevice = detectLowEndDevice();

    // Detectar velocidad de conexión
    const connectionSpeed = detectConnectionSpeed();

    setState({
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      orientation,
      touchDevice,
      devicePixelRatio,
      isLowEndDevice,
      connectionSpeed
    });
  }, []);

  // Detectar dispositivos de gama baja
  const detectLowEndDevice = (): boolean => {
    // Verificar memoria disponible
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 2) return true;

    // Verificar número de núcleos de CPU
    const cores = navigator.hardwareConcurrency;
    if (cores && cores <= 2) return true;

    // Verificar user agent para dispositivos conocidos de gama baja
    const userAgent = navigator.userAgent.toLowerCase();
    const lowEndPatterns = [
      'android 4',
      'android 5',
      'android 6',
      'iphone 5',
      'iphone 6',
      'ipad 2',
      'ipad 3'
    ];

    return lowEndPatterns.some(pattern => userAgent.includes(pattern));
  };

  // Detectar velocidad de conexión
  const detectConnectionSpeed = (): 'slow' | 'fast' | 'unknown' => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) return 'unknown';

    const slowTypes = ['slow-2g', '2g', '3g'];
    const fastTypes = ['4g', '5g'];

    if (slowTypes.includes(connection.effectiveType)) return 'slow';
    if (fastTypes.includes(connection.effectiveType)) return 'fast';
    
    // Verificar por velocidad de descarga
    if (connection.downlink && connection.downlink < 1.5) return 'slow';
    if (connection.downlink && connection.downlink > 10) return 'fast';

    return 'unknown';
  };

  // Feedback háptico
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!state.touchDevice || !('vibrate' in navigator)) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30]
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }, [state.touchDevice]);

  // Optimizar para rendimiento
  const optimizeForPerformance = useCallback((): boolean => {
    return state.isLowEndDevice || state.connectionSpeed === 'slow';
  }, [state.isLowEndDevice, state.connectionSpeed]);

  // Obtener duración óptima de animación
  const getOptimalAnimationDuration = useCallback((baseMs: number): number => {
    if (state.isLowEndDevice) return baseMs * 0.5; // 50% más rápido
    if (state.connectionSpeed === 'slow') return baseMs * 0.7; // 30% más rápido
    if (state.isMobile) return baseMs * 0.8; // 20% más rápido
    return baseMs;
  }, [state.isLowEndDevice, state.connectionSpeed, state.isMobile]);

  // Verificar si se deben reducir animaciones
  const shouldReduceAnimations = useCallback((): boolean => {
    // Verificar preferencias del usuario
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return true;

    // Verificar características del dispositivo
    return state.isLowEndDevice || state.connectionSpeed === 'slow';
  }, [state.isLowEndDevice, state.connectionSpeed]);

  // Obtener calidad óptima de imagen
  const getOptimalImageQuality = useCallback((): 'low' | 'medium' | 'high' => {
    if (state.isLowEndDevice || state.connectionSpeed === 'slow') return 'low';
    if (state.isMobile) return 'medium';
    return 'high';
  }, [state.isLowEndDevice, state.connectionSpeed, state.isMobile]);

  // Verificar si un elemento está en el área segura
  const isInSafeArea = useCallback((element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)')) || 0;
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0;
    const safeAreaLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-left)')) || 0;
    const safeAreaRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right)')) || 0;

    return (
      rect.top >= safeAreaTop &&
      rect.bottom <= window.innerHeight - safeAreaBottom &&
      rect.left >= safeAreaLeft &&
      rect.right <= window.innerWidth - safeAreaRight
    );
  }, []);

  // Configurar listeners de eventos
  useEffect(() => {
    detectDevice();

    const handleResize = () => detectDevice();
    const handleOrientationChange = () => {
      // Delay para permitir que el navegador actualice las dimensiones
      setTimeout(detectDevice, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Listener para cambios en la conexión
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const handleConnectionChange = () => detectDevice();
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [detectDevice]);

  // Configurar meta viewport para móviles
  useEffect(() => {
    if (state.isMobile) {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }, [state.isMobile]);

  // Configurar clases CSS en el body
  useEffect(() => {
    const body = document.body;
    
    // Limpiar clases anteriores
    body.classList.remove('mobile', 'tablet', 'desktop', 'touch', 'no-touch', 'low-end', 'slow-connection');
    
    // Añadir clases apropiadas
    if (state.isMobile) body.classList.add('mobile');
    if (state.isTablet) body.classList.add('tablet');
    if (state.isDesktop) body.classList.add('desktop');
    if (state.touchDevice) body.classList.add('touch');
    if (!state.touchDevice) body.classList.add('no-touch');
    if (state.isLowEndDevice) body.classList.add('low-end');
    if (state.connectionSpeed === 'slow') body.classList.add('slow-connection');
  }, [state]);

  return {
    ...state,
    triggerHapticFeedback,
    optimizeForPerformance,
    getOptimalAnimationDuration,
    shouldReduceAnimations,
    getOptimalImageQuality,
    isInSafeArea
  };
};
