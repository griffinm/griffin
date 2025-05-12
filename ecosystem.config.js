module.exports = {
  apps: [
    {
      name: 'notes-api',
      script: 'npm',
      args: 'run prod',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
