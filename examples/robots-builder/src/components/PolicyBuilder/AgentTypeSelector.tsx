import React from 'react';

export type AgentType = { id: string; name: string; category: 'search-engine' | 'ai-assistant' | 'price-monitor' | 'research' | 'custom'; riskLevel: number; commonUserAgents?: string[] };

const defaults: AgentType[] = [
  { id: 'googlebot', name: 'Google Search', category: 'search-engine', riskLevel: 1 },
  { id: 'gpt-crawler', name: 'OpenAI GPT', category: 'ai-assistant', riskLevel: 3 },
  { id: 'price-scrapers', name: 'Price Monitors', category: 'price-monitor', riskLevel: 8 }
];

export function AgentTypeSelector({ onAgentsChange }: { onAgentsChange: (agents: AgentType[]) => void }) {
  const [agents, setAgents] = React.useState<AgentType[]>(defaults);
  React.useEffect(() => { onAgentsChange(agents); }, [agents]);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Agents</h2>
      <ul className="list-disc pl-6">
        {agents.map(a => (<li key={a.id}>{a.name} <span className="text-gray-500">({a.category})</span></li>))}
      </ul>
    </div>
  );
}
