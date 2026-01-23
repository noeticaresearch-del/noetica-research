import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/metronome-app/", // ← ここをリポジトリ名に合わせる
});
