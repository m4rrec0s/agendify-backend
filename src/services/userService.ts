import prisma from "../database";
import { uploadToDrive } from "../config/googleDrive";

interface UpdateUserInput {
  firebaseUid: string;
  userData: {
    email?: string;
    name?: string;
    role?: "client" | "owner";
    image?: Express.Multer.File | null;
    businesses?: any[];
    appointments?: any[];
  };
}

class UserService {
  async updateUser({ firebaseUid, userData }: UpdateUserInput) {
    try {
      let imageUrl;

      if (userData.image) {
        imageUrl = await uploadToDrive(userData.image);
      }

      const user = await prisma.user.update({
        where: { firebaseUid },
        data: {
          name: userData.name,
          role: userData.role,
          imageUrl: imageUrl,
          updatedAt: new Date(),
        },
      });
      return user;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  async getAllUsers() {
    try {
      const users = await prisma.user.findMany();
      return users;
    } catch (error: any) {
      throw new Error(`Erro ao obter usuários: ${error.message}`);
    }
  }

  async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error: any) {
      throw new Error(`Erro ao obter usuário: ${error.message}`);
    }
  }

  async deleteUser(id: string) {
    try {
      const user = await prisma.user.delete({
        where: { id },
      });
      return user;
    } catch (error: any) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }
  }
}

export default new UserService();
