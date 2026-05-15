import { Router } from "express";

export const oauthRouter = Router();

// Placeholder OAuth callback - not used in this app
oauthRouter.get("/callback", (_req, res) => {
  res.redirect("/");
});
