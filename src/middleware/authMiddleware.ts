import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import { DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    let idToken = authHeader.split(" ")[1];
    if (idToken.startsWith("Bearer ")) {
      idToken = idToken.split(" ")[1];
    }

    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = decodedToken;
    return next();
  } catch (error: any) {
    res.status(401).json({ error: "Token inválido", details: error.message });
    return;
  }
};
