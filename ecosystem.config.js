// PM2 process config for ARCANE.UZ (Next.js 14, `next start`).
//
// IMPORTANT: single instance / fork mode only.
// The app keeps state in process memory — SSE notification streams
// (/api/notifications/stream), in-memory rate limiting (lib/rateLimit.ts)
// and the Digiseller cache. Running multiple instances (cluster mode) would
// split that state and break live notifications + rate limits. Scale
// vertically (bigger box) rather than adding instances.
//
// Usage on the server:
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup     # survive reboots
//   pm2 logs arcane             # tail logs
//   pm2 restart arcane          # after a deploy

module.exports = {
  apps: [
    {
      name:   'arcane',
      cwd:    '/var/www/arcane',
      script: 'node_modules/next/dist/bin/next',
      args:   'start -p 3000',

      instances:  1,
      exec_mode:  'fork',

      max_memory_restart: '600M',
      autorestart:        true,
      watch:              false,

      env: {
        NODE_ENV: 'production',
        PORT:     3000,
      },

      // Logs (rotate with `pm2 install pm2-logrotate`)
      out_file:   '/var/log/arcane/out.log',
      error_file: '/var/log/arcane/error.log',
      merge_logs: true,
      time:       true,
    },
  ],
};
