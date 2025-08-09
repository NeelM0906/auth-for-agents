import React from 'react';

export type ResourcePattern = { pattern: string; description?: string };

export function ResourceSelector({ onResourcesChange }: { onResourcesChange: (resources: ResourcePattern[]) => void; detectedResources?: ResourcePattern[] }) {
  const [items, setItems] = React.useState<ResourcePattern[]>([]);
  const [pattern, setPattern] = React.useState('');
  const [description, setDescription] = React.useState('');

  function add() {
    if (!pattern) return;
    const next = [...items, { pattern, description }];
    setItems(next);
    onResourcesChange(next);
    setPattern('');
    setDescription('');
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Resources</h2>
      <div className="flex gap-2">
        <input className="border px-2 py-1 flex-1" placeholder="/products/*" value={pattern} onChange={e => setPattern(e.target.value)} />
        <input className="border px-2 py-1 flex-1" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <button className="border px-3 py-1" onClick={add}>Add</button>
      </div>
      <ul className="list-disc pl-6">
        {items.map((r, i) => (<li key={i}><code>{r.pattern}</code> {r.description && `— ${r.description}`}</li>))}
      </ul>
    </div>
  );
}
