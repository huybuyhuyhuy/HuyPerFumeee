module.exports = {
  apps: [
    {
      name: 'huyperfume-api',
      script: 'server.js',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      max_restarts: 10,
      restart_delay: 5000,
      node_args: '--max-old-space-size=512',
    },
  ],
};
