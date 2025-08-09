import React, { useMemo } from 'react';
import create from 'zustand';
import debounce from 'lodash.debounce';
import type { z } from 'zod';
import { PolicySchema, type Policy } from '@auth4agents/policy';
import { ResourceSelector } from '../src/components/PolicyBuilder/ResourceSelector';
import { AgentTypeSelector } from '../src/components/PolicyBuilder/AgentTypeSelector';
import { PermissionMatrix } from '../src/components/PolicyBuilder/PermissionMatrix';
import { RateLimitConfig } from '../src/components/PolicyBuilder/RateLimitConfig';
import { PolicyPreview } from '../src/components/PolicyBuilder/PolicyPreview';
import { generatePolicy } from '../src/lib/policyGenerator';

export type ValidationResult = { ok: true; policy: Policy } | { ok: false; error: string };

type BuilderState = {
  builderConfig: any;
  setBuilderConfig: (partial: any) => void;
  validation?: ValidationResult;
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  builderConfig: {},
  setBuilderConfig: (partial) => set({ builderConfig: { ...get().builderConfig, ...partial } }),
}));

function usePolicyValidation() {
  const { builderConfig } = useBuilderStore();
  const [validation, setValidation] = React.useState<ValidationResult>();

  const run = useMemo(() => debounce((config: any) => {
    try {
      const policy = generatePolicy(config);
      const parsed = PolicySchema.safeParse(policy) as z.SafeParseReturnType<any, Policy>;
      if (!parsed.success) {
        setValidation({ ok: false, error: parsed.error.errors.map(e => e.message).join('; ') });
      } else {
        setValidation({ ok: true, policy: parsed.data });
      }
    } catch (e: any) {
      setValidation({ ok: false, error: e.message });
    }
  }, 300), []);

  React.useEffect(() => {
    run(builderConfig);
  }, [builderConfig, run]);

  return validation;
}

export default function BuilderPage() {
  const validation = usePolicyValidation();
  const setConfig = useBuilderStore(s => s.setBuilderConfig);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Robots.txt Builder</h1>
      <ResourceSelector onResourcesChange={(r) => setConfig({ resources: r })} />
      <AgentTypeSelector onAgentsChange={(a) => setConfig({ agents: a })} />
      <PermissionMatrix onMatrixChange={(m) => setConfig({ permissions: m })} />
      <RateLimitConfig onRateLimitsChange={(rl) => setConfig({ rateLimits: rl })} />
      <PolicyPreview validation={validation} />
    </div>
  );
}
