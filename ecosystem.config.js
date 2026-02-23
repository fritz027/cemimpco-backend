module.exports = {
  apps: [
    {
      name: "CEMIMPCO-WEBAPP-MOCK",
      script: "build/server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};