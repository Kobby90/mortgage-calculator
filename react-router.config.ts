import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  future: {
    v7_partialHydration: true,
  },
  routes: {
    directory: "routes",
    extension: ".tsx"
  },
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  typescript: {
    enabled: true,
    emitTypes: true
  }
} satisfies Config;
