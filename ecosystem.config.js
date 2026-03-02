module.exports = {
  apps: [
    {
      name: "CEMIMPCO-WEBAPP",
      script: "build/server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};