declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Firebase environment variables are handled through app.config.js
      // Add any additional environment variables here if needed
    }
  }
}

// Ensure this file is treated as a module
export {};
