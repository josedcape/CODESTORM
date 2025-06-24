import { useState, useEffect, useCallback } from 'react';

export interface TokenUsage {
  agentName: string;
  sessionTokens: number;
  totalTokens: number;
  lastUsed: number;
  apiCalls: number;
  averageTokensPerCall: number;
}

export interface TokenAlert {
  id: string;
  agentName: string;
  currentTokens: number;
  threshold: number;
  type: 'warning' | 'critical';
  timestamp: number;
  acknowledged: boolean;
}

export interface TokenTrackingState {
  agentUsage: Record<string, TokenUsage>;
  alerts: TokenAlert[];
  sessionStartTime: number;
  totalSessionTokens: number;
}

const STORAGE_KEY = 'codestorm_token_tracking';
const WARNING_THRESHOLD = 90000; // 90k tokens
const CRITICAL_THRESHOLD = 100000; // 100k tokens

const AGENT_NAMES = [
  'CodeModifierAgent',
  'HTMLAgent', 
  'CSSAgent',
  'JavaScriptAgent',
  'PlanningAgent',
  'ReviewAgent',
  'GIFTAgent',
  'ProductionAgent',
  'PromptEnhancerAgent'
];

export const useTokenTracking = () => {
  const [trackingState, setTrackingState] = useState<TokenTrackingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          sessionStartTime: Date.now(),
          totalSessionTokens: 0,
          // Reset session tokens for all agents
          agentUsage: Object.fromEntries(
            Object.entries(parsed.agentUsage || {}).map(([key, value]: [string, any]) => [
              key,
              { ...value, sessionTokens: 0 }
            ])
          )
        };
      } catch (error) {
        console.error('Error parsing stored token tracking data:', error);
      }
    }
    
    // Initialize with default values
    return {
      agentUsage: Object.fromEntries(
        AGENT_NAMES.map(name => [
          name,
          {
            agentName: name,
            sessionTokens: 0,
            totalTokens: 0,
            lastUsed: 0,
            apiCalls: 0,
            averageTokensPerCall: 0
          }
        ])
      ),
      alerts: [],
      sessionStartTime: Date.now(),
      totalSessionTokens: 0
    };
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackingState));
  }, [trackingState]);

  // Generate unique ID for alerts
  const generateAlertId = () => `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check for threshold alerts
  const checkThresholds = useCallback((agentName: string, totalTokens: number) => {
    const alerts: TokenAlert[] = [];
    
    if (totalTokens >= CRITICAL_THRESHOLD) {
      alerts.push({
        id: generateAlertId(),
        agentName,
        currentTokens: totalTokens,
        threshold: CRITICAL_THRESHOLD,
        type: 'critical',
        timestamp: Date.now(),
        acknowledged: false
      });
    } else if (totalTokens >= WARNING_THRESHOLD) {
      alerts.push({
        id: generateAlertId(),
        agentName,
        currentTokens: totalTokens,
        threshold: WARNING_THRESHOLD,
        type: 'warning',
        timestamp: Date.now(),
        acknowledged: false
      });
    }
    
    return alerts;
  }, []);

  // Track token usage for a specific agent
  const trackTokenUsage = useCallback((agentName: string, tokensUsed: number) => {
    setTrackingState(prev => {
      const currentUsage = prev.agentUsage[agentName] || {
        agentName,
        sessionTokens: 0,
        totalTokens: 0,
        lastUsed: 0,
        apiCalls: 0,
        averageTokensPerCall: 0
      };

      const newSessionTokens = currentUsage.sessionTokens + tokensUsed;
      const newTotalTokens = currentUsage.totalTokens + tokensUsed;
      const newApiCalls = currentUsage.apiCalls + 1;
      const newAverageTokensPerCall = newTotalTokens / newApiCalls;

      const updatedUsage = {
        ...currentUsage,
        sessionTokens: newSessionTokens,
        totalTokens: newTotalTokens,
        lastUsed: Date.now(),
        apiCalls: newApiCalls,
        averageTokensPerCall: Math.round(newAverageTokensPerCall)
      };

      // Check for new alerts
      const newAlerts = checkThresholds(agentName, newTotalTokens);
      
      return {
        ...prev,
        agentUsage: {
          ...prev.agentUsage,
          [agentName]: updatedUsage
        },
        alerts: [...prev.alerts, ...newAlerts],
        totalSessionTokens: prev.totalSessionTokens + tokensUsed
      };
    });
  }, [checkThresholds]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setTrackingState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  }, []);

  // Reset tokens for a specific agent
  const resetAgentTokens = useCallback((agentName: string) => {
    setTrackingState(prev => ({
      ...prev,
      agentUsage: {
        ...prev.agentUsage,
        [agentName]: {
          ...prev.agentUsage[agentName],
          sessionTokens: 0,
          totalTokens: 0,
          apiCalls: 0,
          averageTokensPerCall: 0,
          lastUsed: 0
        }
      },
      alerts: prev.alerts.filter(alert => alert.agentName !== agentName)
    }));
  }, []);

  // Reset all tokens
  const resetAllTokens = useCallback(() => {
    setTrackingState(prev => ({
      ...prev,
      agentUsage: Object.fromEntries(
        Object.entries(prev.agentUsage).map(([key, value]) => [
          key,
          {
            ...value,
            sessionTokens: 0,
            totalTokens: 0,
            apiCalls: 0,
            averageTokensPerCall: 0,
            lastUsed: 0
          }
        ])
      ),
      alerts: [],
      totalSessionTokens: 0
    }));
  }, []);

  // Get usage statistics
  const getUsageStats = useCallback(() => {
    const agents = Object.values(trackingState.agentUsage);
    const totalTokensAllTime = agents.reduce((sum, agent) => sum + agent.totalTokens, 0);
    const totalApiCalls = agents.reduce((sum, agent) => sum + agent.apiCalls, 0);
    const mostUsedAgent = agents.reduce((max, agent) => 
      agent.totalTokens > max.totalTokens ? agent : max, agents[0]
    );
    const activeAlerts = trackingState.alerts.filter(alert => !alert.acknowledged);

    return {
      totalTokensAllTime,
      totalSessionTokens: trackingState.totalSessionTokens,
      totalApiCalls,
      mostUsedAgent: mostUsedAgent?.agentName || 'None',
      activeAlertsCount: activeAlerts.length,
      sessionDuration: Date.now() - trackingState.sessionStartTime,
      averageTokensPerCall: totalApiCalls > 0 ? Math.round(totalTokensAllTime / totalApiCalls) : 0
    };
  }, [trackingState]);

  // Export usage data
  const exportUsageData = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      sessionInfo: {
        startTime: new Date(trackingState.sessionStartTime).toISOString(),
        duration: Date.now() - trackingState.sessionStartTime,
        totalSessionTokens: trackingState.totalSessionTokens
      },
      agentUsage: trackingState.agentUsage,
      alerts: trackingState.alerts,
      summary: getUsageStats()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codestorm_token_usage_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [trackingState, getUsageStats]);

  return {
    trackingState,
    trackTokenUsage,
    acknowledgeAlert,
    resetAgentTokens,
    resetAllTokens,
    getUsageStats,
    exportUsageData,
    WARNING_THRESHOLD,
    CRITICAL_THRESHOLD
  };
};
