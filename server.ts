import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  // Render typically provides the PORT environment variable as a string.
  // We use Number() to ensure it's a number for Express's listen method.
  const PORT = Number(process.env.PORT) || 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);

  app.use(express.json({ limit: "50mb" }));

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serving from the bundled 'dist' directory
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 and the port provided by the environment (Render/Cloud Run requirement)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
