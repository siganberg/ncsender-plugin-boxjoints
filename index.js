/**
 * BoxJoints Plugin - Node.js Lifecycle Wrapper
 * Thin wrapper for the community (Node.js) version.
 * Reads config.html and shows it as a dialog.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const resolveServerPort = (pluginSettings = {}, appSettings = {}) => {
  const appPort = Number.parseInt(appSettings?.senderPort, 10);
  if (Number.isFinite(appPort)) return appPort;
  const pluginPort = Number.parseInt(pluginSettings?.port, 10);
  if (Number.isFinite(pluginPort)) return pluginPort;
  return 8090;
};

export async function onLoad(ctx) {
  ctx.log('BoxJoints plugin loaded');

  ctx.registerToolMenu('Box Joints', async () => {
    ctx.log('Box Joints tool opened');

    const storedSettings = ctx.getSettings() || {};
    const currentAppSettings = ctx.getAppSettings() || {};
    const serverPort = resolveServerPort(storedSettings, currentAppSettings);
    const initialConfigJson = JSON.stringify(storedSettings)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e');

    let html = readFileSync(join(__dirname, 'config.html'), 'utf-8');
    html = html.replace('__SERVER_PORT__', String(serverPort));
    html = html.replace('__INITIAL_CONFIG__', initialConfigJson);

    ctx.showDialog('Box Joints', html, { size: 'large' });
  }, {
    icon: 'logo.png'
  });
}

export async function onUnload(ctx) {
  ctx.log('BoxJoints plugin unloaded');
}
