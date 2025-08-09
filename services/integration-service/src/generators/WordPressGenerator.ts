import type { Policy } from '@auth4agents/policy';
import { PlatformGenerator, type GeneratedCode } from './PlatformGenerator.js';

export class WordPressGenerator extends PlatformGenerator {
  generateMiddleware(policy: Policy): GeneratedCode {
    const php = `<?php
/*
Plugin Name: Auth for Agents Policy
Description: Serves agent policy and enforces basic headers (placeholder)
*/

add_action('rest_api_init', function () {
  register_rest_route('a4a/v1', '/policy', [
    'methods' => 'GET',
    'callback' => function () {
      return new WP_REST_Response(${JSON.stringify(policy)}, 200);
    }
  ]);
});
?>`;

    return {
      files: [ { path: 'wp-plugin/auth-for-agents/auth-for-agents.php', content: php } ],
      installCommands: [],
      integrationCode: 'Zip folder and upload plugin'
    };
  }
  generateDeploymentInstructions() { return { steps: ['Upload plugin zip', 'Activate in admin'] }; }
  validateConfiguration() { return { ok: true }; }
}


