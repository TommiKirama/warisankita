import { Router } from "express";
import { FAQ, LESSONS } from "../data/fiqh.js";

export const educationRouter = Router();

/** Faraid Education Hub — bite-sized lessons. Optional ?category= filter. */
educationRouter.get("/lessons", (req, res) => {
  const category = req.query.category as string | undefined;
  const lessons = category ? LESSONS.filter((l) => l.category === category) : LESSONS;
  res.json(lessons);
});

educationRouter.get("/lessons/:id", (req, res) => {
  const lesson = LESSONS.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json(lesson);
});

/** Verified ulama Q&A. */
educationRouter.get("/faq", (_req, res) => {
  res.json(FAQ);
});
