import { PrismaClient } from "@prisma/client";
import { uploadToDrive, deleteFromDrive } from "../config/googleDrive";

const prisma = new PrismaClient();

const extractDriveIdFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  return match ? match[1] : null;
};

interface CreateServiceInput {
  businessId: string;
  name: string;
  description?: string;
  image?: Express.Multer.File | null;
  duration: number;
  price: number;
}

interface UpdateServiceInput {
  name?: string;
  description?: string;
  image?: Express.Multer.File | null;
  duration?: number;
  price?: number;
}

class ServiceService {
  async createService(firebaseUid: string, data: CreateServiceInput) {
    try {
      const user = await prisma.user.findUnique({
        where: { firebaseUid },
      });
      if (!user || user.role !== "owner") {
        throw new Error("Apenas proprietários podem criar serviços");
      }

      const business = await prisma.business.findUnique({
        where: { id: data.businessId },
      });
      if (!business || business.ownerId !== user.id) {
        throw new Error("Negócio não encontrado ou não pertence ao usuário");
      }

      let imageUrl;

      if (data.image) {
        imageUrl = await uploadToDrive(data.image);
      }

      const service = await prisma.service.create({
        data: {
          businessId: data.businessId,
          name: data.name,
          description: data.description,
          imageUrl: imageUrl,
          duration: data.duration,
          price: data.price,
        },
      });

      return service;
    } catch (error: any) {
      throw new Error(`Erro ao criar serviço: ${error.message}`);
    }
  }

  async updateService(
    firebaseUid: string,
    serviceId: string,
    data: UpdateServiceInput
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { firebaseUid },
      });
      if (!user || user.role !== "owner") {
        throw new Error("Apenas proprietários podem atualizar serviços");
      }

      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { business: true },
      });
      if (!service || service.business.ownerId !== user.id) {
        throw new Error("Serviço não encontrado ou não pertence ao usuário");
      }

      let imageUrl = service.imageUrl;

      // Se uma nova imagem foi enviada, faz o upload e exclui a antiga
      if (data.image) {
        // Obtém o ID da imagem antiga e exclui do Drive
        const oldImageId = extractDriveIdFromUrl(service.imageUrl);
        if (oldImageId) {
          await deleteFromDrive(oldImageId);
        }

        // Faz upload da nova imagem
        imageUrl = await uploadToDrive(data.image);
      }

      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
          name: data.name,
          description: data.description,
          imageUrl: imageUrl,
          duration: data.duration,
          price: data.price,
          updatedAt: new Date(),
        },
      });

      return updatedService;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar serviço: ${error.message}`);
    }
  }

  async getService(serviceId: string) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { business: true },
      });
      if (!service) {
        throw new Error("Serviço não encontrado");
      }
      return service;
    } catch (error: any) {
      throw new Error(`Erro ao buscar serviço: ${error.message}`);
    }
  }

  async getServicesByBusiness(businessId: string) {
    try {
      const services = await prisma.service.findMany({
        where: { businessId },
      });
      return services;
    } catch (error: any) {
      throw new Error(`Erro ao listar serviços: ${error.message}`);
    }
  }

  async deleteService(firebaseUid: string, serviceId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { firebaseUid },
      });
      if (!user || user.role !== "owner") {
        throw new Error("Apenas proprietários podem deletar serviços");
      }

      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { business: true },
      });
      if (!service || service.business.ownerId !== user.id) {
        throw new Error("Serviço não encontrado ou não pertence ao usuário");
      }

      // Excluir a imagem do Google Drive antes de excluir o serviço
      if (service.imageUrl) {
        const imageId = extractDriveIdFromUrl(service.imageUrl);
        if (imageId) {
          await deleteFromDrive(imageId);
        }
      }

      await prisma.service.delete({
        where: { id: serviceId },
      });

      return { message: "Serviço deletado com sucesso" };
    } catch (error: any) {
      throw new Error(`Erro ao deletar serviço: ${error.message}`);
    }
  }
}

export default new ServiceService();
