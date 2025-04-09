import { auth } from "../config/firebase";
import axios from "axios";
import prisma from "../database";

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

interface RegisterInput {
  firebaseUid: string;
  email: string;
  name: string;
  imageUrl?: string;
  role: "client" | "owner" | "admin";
}

interface GoogleLoginInput {
  idToken: string;
  firebaseUid?: string;
  email: string;
  name: string;
  imageUrl?: string;
  role: "client" | "owner";
}

class AuthService {
  async register({ firebaseUid, email, name, imageUrl, role }: RegisterInput) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { firebaseUid },
      });

      if (existingUser) {
        throw new Error("Usuário já registrado");
      }

      const user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          name,
          imageUrl,
          role,
        },
      });

      return user;
    } catch (error: any) {
      throw new Error(`Erro ao registrar usuário: ${error.message}`);
    }
  }

  async googleLogin({
    idToken,
    firebaseUid,
    email,
    name,
    imageUrl,
    role,
  }: GoogleLoginInput) {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      if (firebaseUid && firebaseUid !== uid) {
        throw new Error("firebaseUid não corresponde ao idToken");
      }

      let user = await prisma.user.findUnique({
        where: { firebaseUid: uid },
      });

      if (!user) {
        // Verificação mais clara de cada campo necessário
        if (!email) {
          throw new Error("Email é necessário para o registro");
        }
        if (!name) {
          throw new Error("Nome é necessário para o registro");
        }
        if (!role) {
          throw new Error("Role (client/owner) é necessário para o registro");
        }

        user = await this.register({
          firebaseUid: uid,
          email,
          name,
          imageUrl,
          role,
        });
      }

      return { idToken, firebaseUid: uid, user };
    } catch (error: any) {
      throw new Error(`Erro ao fazer login com Google: ${error.message}`);
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );

      interface FirebaseAuthResponse {
        idToken: string;
        localId: string;
      }

      const { idToken, localId: uid } = response.data as FirebaseAuthResponse;

      const user = await prisma.user.findUnique({
        where: { firebaseUid: uid },
      });

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      return { idToken, firebaseUid: uid, user };
    } catch (error: any) {
      throw new Error(
        `Erro ao fazer login: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }

  async verifyFirebaseUid(firebaseUid: string) {
    try {
      const firebaseUser = await auth.getUser(firebaseUid);
      const user = await prisma.user.findUnique({
        where: { firebaseUid },
      });

      if (!user) {
        throw new Error("Usuário não encontrado no banco de dados");
      }

      return user;
    } catch (error: any) {
      throw new Error(`Erro ao verificar firebaseUid: ${error.message}`);
    }
  }
}

export default new AuthService();
