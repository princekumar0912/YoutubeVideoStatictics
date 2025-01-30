// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'


// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
// })
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Import Tailwind CSS plugin for Vite

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add Tailwind CSS plugin here
  ],
});
