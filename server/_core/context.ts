import type { Request, Response } from "express";

export interface TrpcContext {
  req: Request;
  res: Response;
  user: null | {
    id: number;
    openId: string;
    email: string | null;
    name: string | null;
    loginMethod: string | null;
    role: "user" | "admin";
    createdAt: Date;
    updatedAt: Date;
    lastSignedIn: Date;
  };
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<TrpcContext> {
  return {
    req,
    res,
    user: null,
  };
}
