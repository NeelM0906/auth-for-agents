import React from 'react';

export type Permission = 'allow' | 'block' | 'rate-limited' | 'require-auth';
export type PermissionCell = { resource: string; agentType: string; permission: Permission };

export function PermissionMatrix({ onMatrixChange }: { onMatrixChange: (matrix: PermissionCell[]) => void }) {
  const [cells, setCells] = React.useState<PermissionCell[]>([]);
  React.useEffect(() => { onMatrixChange(cells); }, [cells]);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Permissions</h2>
      <div className="text-sm text-gray-600">Drag-and-drop matrix can be implemented later; for now this is a stub.</div>
    </div>
  );
}
