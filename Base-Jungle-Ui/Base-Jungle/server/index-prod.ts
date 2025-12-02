import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";

const distPath = import.meta.dirname;

console.log(`[Static] Serving static files from: ${distPath}`);
try {
  const files = fs.readdirSync(distPath);
  console.log(`[Static] Files in dist: ${files.join(", ")}`);
} catch (e) {
  console.error(`[Static] Failed to list files in ${distPath}:`, e);
}

if (!fs.existsSync(distPath)) {
  throw new Error(
    `Could not find the build directory: ${distPath}, make sure to build the client first`,
  );
}

app.use(express.static(distPath));

// fall through to index.html if the file doesn't exist
app.use("*", (req, res) => {
  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error(`[Static] index.html not found at ${indexPath}`);
    return res.status(404).json({ error: "index.html not found", path: indexPath });
  }
  res.sendFile(indexPath);
});
}

(async () => {
  await runApp(serveStatic);
})();
