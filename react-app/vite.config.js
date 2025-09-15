import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apacheflink-csvtojson-and-jsonAggregation-development-example/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})