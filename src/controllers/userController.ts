import { Request, Response } from "express";
import UserService from "../services/userService";

class UserController {
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const firebaseUid = req.user?.uid;

      if (!firebaseUid) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const userData = {
        ...req.body,
        image: req.file || null,
      };

      const updatedUser = await UserService.updateUser({
        firebaseUid,
        userData,
      });

      res.status(200).json(updatedUser);
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const firebaseUid = req.params.id;
      const user = await UserService.getUserById(firebaseUid);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const firebaseUid = req.params.id;
      await UserService.deleteUser(firebaseUid);
      res.status(200).json({ message: "Usuário deletado com sucesso" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UserController();
