// app.config.ts
import { defineConfig } from "@tanstack/start/config";
var app_config_default = defineConfig({
  server: {
    preset: "node-server"
  }
});
export {
  app_config_default as default
};
