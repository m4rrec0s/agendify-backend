import { Request, Response } from "express";
import AuthService from "../services/authService";
import { auth } from "../config/firebase";
import prisma from "../database";

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ message: "Dados incompletos" });
      return;
    }

    if (role !== "client" && role !== "owner") {
      res.status(400).json({ message: "Role inválido" });
      return;
    }

    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });

      const user = await AuthService.register({
        firebaseUid: userRecord.uid,
        email,
        name,
        role,
      });

      res.status(201).json({
        firebaseUid: userRecord.uid,
        user,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "E-mail e senha são obrigatórios" });
      return;
    }

    try {
      const { idToken, firebaseUid, user } = await AuthService.login(
        email,
        password
      );
      res.status(200).json({
        firebaseUid,
        idToken,
        user,
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    const { idToken, firebaseUid, email, name, imageUrl, role } = req.body;

    if (!idToken) {
      res.status(400).json({ message: "idToken é obrigatório" });
      return;
    }

    try {
      if (!role && !(await prisma.user.findFirst({ where: { email } }))) {
        res.status(400).json({
          message: "role é obrigatório para novos usuários",
          requiredFields: { role: true },
        });
        return;
      }

      const result = await AuthService.googleLogin({
        idToken,
        firebaseUid,
        email,
        name,
        imageUrl,
        role,
      });
      if (!result.user) {
        res
          .status(404)
          .json({ message: "Usuário não encontrado, complete o registro" });
        return;
      }
      res.status(200).json({
        message: "Login com Google bem-sucedido",
        idToken: result.idToken,
        firebaseUid: result.firebaseUid,
        user: result.user,
      });
      return;
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      res.status(401).json({
        message: error.message,
        details:
          "Verifique se todos os campos obrigatórios foram fornecidos (email, name, role)",
      });
      return;
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const firebaseUid = req.user?.uid;

      if (!firebaseUid) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const user = await AuthService.verifyFirebaseUid(firebaseUid);

      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }

      res.status(200).json({
        message: "Autenticação bem-sucedida",
        user,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
