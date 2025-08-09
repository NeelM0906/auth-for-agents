import React from 'react';
import type { Policy } from '@auth4agents/policy';

type ValidationResult = { ok: true; policy: Policy } | { ok: false; error: string } | undefined;

export function PolicyPreview({ validation }: { validation?: ValidationResult }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Policy Preview</h2>
      {validation && 'ok' in validation && !validation.ok && (
        <div className="border border-red-300 bg-red-50 text-red-700 p-3 text-sm">{validation.error}</div>
      )}
      {validation && 'ok' in validation && validation.ok && (
        <pre className="bg-gray-900 text-gray-100 p-3 text-xs overflow-auto rounded">
{JSON.stringify(validation.policy as Policy, null, 2)}
        </pre>
      )}
    </div>
  );
}
