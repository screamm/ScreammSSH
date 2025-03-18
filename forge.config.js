const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    osxSign: {},
    win32metadata: {
      "requested-execution-level": "asInvoker"
    },
    env: {
      "ELECTRON_DISABLE_SECURITY_WARNINGS": "true"
    },
    ignore: [
      /node_modules\/\.bin/,
      /\.git/,
      /\.vscode/,
      /\.idea/,
      /\.env/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {}
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        devContentSecurityPolicy: [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data:",
          "img-src 'self' data:",
          "connect-src 'self'"
        ].join('; '),
        renderer: {
          config: './webpack.renderer.config.js',
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          sandbox: true,
          webPreferences: {
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            nodeIntegrationInSubFrames: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            sandbox: true
          },
          entryPoints: [
            {
              name: 'main_window',
              html: './src/renderer/index.html',
              js: './src/renderer/index.tsx',
              preload: {
                js: './src/preload.js'
              }
            }
          ]
        },
        port: 3030,
        loggerPort: 9000
      }
    }
  ]
}; 