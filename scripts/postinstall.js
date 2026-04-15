/**
 * Postinstall script for AionUi WebUI-only server build.
 *
 * Electron packaging no longer exists, so postinstall intentionally stays
 * lightweight and avoids native Electron rebuild steps.
 */

function runPostInstall() {
  console.log('[postinstall] WebUI-only server mode: no Electron app dependency rebuild required');
}

if (require.main === module) {
  runPostInstall();
}

module.exports = runPostInstall;
