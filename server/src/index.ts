import express from "express";
import cors from "cors";
import { faraidRouter } from "./routes/faraid.js";
import { wasiyyahRouter } from "./routes/wasiyyah.js";
import { vaultRouter } from "./routes/vault.js";
import { educationRouter } from "./routes/education.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "WarisanKita API", time: new Date().toISOString() });
});

app.use("/api/faraid", faraidRouter);
app.use("/api/wasiyyah", wasiyyahRouter);
app.use("/api/vault", vaultRouter);
app.use("/api/education", educationRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`\n  WarisanKita API  →  http://localhost:${PORT}`);
  console.log(`  Health check     →  http://localhost:${PORT}/api/health\n`);
});
