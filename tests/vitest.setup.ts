/**
 * Vitest Test Setup
 * Global configuration for extension system tests
 */

// Register NodePlatformServices so modules that call getPlatformServices() work in tests.
import { registerPlatformServices } from '../src/common/platform';
import { NodePlatformServices } from '../src/common/platform/NodePlatformServices';
registerPlatformServices(new NodePlatformServices());

// Make this a module
