import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    cross_origin_isolated: true,
    permissions: ["microphone"],
    host_permissions: ["<all_urls>"],
    action: { default_popup: "popup.html" },
  },
  vite: () => ({
    optimizeDeps: {
      exclude: ["@xenova/transformers"],
    },
    plugins: [tailwindcss()],
  }),
});
