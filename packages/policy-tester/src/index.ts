import type { Policy } from '@auth4agents/policy';
import { matchOperation } from '@auth4agents/policy';

export type TestCase = { name: string; userAgent: string; path: string; method?: string; expectedResult: 'allow' | 'block' | 'rate-limit' };
export type SimulationResult = { status: 'allow' | 'block' | 'rate-limit'; reason?: string };
export type TestResults = { passed: number; failed: number; details: Array<{ testCase: TestCase; expected: string; actual: SimulationResult; passed: boolean }>; };

export class PolicyTester {
  async testPolicy(policy: Policy, testCases: TestCase[]): Promise<TestResults> {
    const results: TestResults = { passed: 0, failed: 0, details: [] };
    for (const testCase of testCases) {
      const result = await this.simulateRequest(testCase, policy);
      const passed = result.status === testCase.expectedResult;
      results.details.push({ testCase, expected: testCase.expectedResult, actual: result, passed });
      if (passed) results.passed++; else results.failed++;
    }
    return results;
  }

  private async simulateRequest(testCase: TestCase, policy: Policy): Promise<SimulationResult> {
    const method = (testCase.method || 'GET').toUpperCase();
    const origin = 'https://example.com';
    const op = matchOperation(policy, { method, url: new URL(testCase.path, origin).toString() });
    if (!op) return { status: 'block', reason: 'no_operation_match' };
    // naive: if rate_limits exist, mark rate-limit otherwise allow
    if (policy.rate_limits && policy.rate_limits.length > 0) return { status: 'rate-limit' };
    return { status: 'allow' };
  }
}

export const standardTests: TestCase[] = [
  { name: 'Googlebot accessing sitemap', userAgent: 'Googlebot', path: '/sitemap.xml', expectedResult: 'allow' },
  { name: 'Unknown scraper accessing products', userAgent: 'custom-scraper/1.0', path: '/products/123', expectedResult: 'block' }
];
