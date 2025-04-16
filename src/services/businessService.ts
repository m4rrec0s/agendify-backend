import prisma from "../database";
import { uploadToDrive, deleteFromDrive } from "../config/googleDrive";

const extractDriveIdFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  return match ? match[1] : null;
};

interface CreateBusinessInput {
  firebaseUid: string;
  businessData: {
    name: string;
    image?: Express.Multer.File | null;
    description?: string;
    address?: string;
    phone?: string;
    categoryId: string;
    workingHours: {
      day: string;
      open: string;
      close: string;
      timeOut?: {
        start: string;
        end: string;
      };
    }[];
  };
}

class BusinessService {
  async createBusiness({ firebaseUid, businessData }: CreateBusinessInput) {
    try {
      let imageUrl;

      if (businessData.image) {
        imageUrl = await uploadToDrive(businessData.image);
      }

      const user = await prisma.user.findUnique({ where: { firebaseUid } });
      if (!user || user.role !== "owner") {
        throw new Error("Apenas proprietários podem criar negócios");
      }

      if (!businessData.categoryId) {
        throw new Error("A categoria do negócio é obrigatória");
      }

      const categoryExists = await prisma.category.findUnique({
        where: { id: businessData.categoryId },
      });

      if (!categoryExists) {
        throw new Error("Categoria não encontrada");
      }

      const formattedWorkingHours = {
        week: {
          start: "",
          "time-out": {
            start: "",
            end: "",
          },
          end: "",
        },
        weekend: {
          start: "",
          end: "",
        },
      };

      if (Array.isArray(businessData.workingHours)) {
        for (const schedule of businessData.workingHours) {
          if (
            ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(
              schedule.day.toLowerCase()
            )
          ) {
            formattedWorkingHours.week.start = schedule.open;
            formattedWorkingHours.week.end = schedule.close;

            if (schedule.timeOut) {
              formattedWorkingHours.week["time-out"].start =
                schedule.timeOut.start;
              formattedWorkingHours.week["time-out"].end = schedule.timeOut.end;
            }
          } else if (
            ["saturday", "sunday"].includes(schedule.day.toLowerCase())
          ) {
            formattedWorkingHours.weekend.start = schedule.open;
            formattedWorkingHours.weekend.end = schedule.close;
          }
        }
      }

      const business = await prisma.business.create({
        data: {
          name: businessData.name,
          imageUrl: imageUrl,
          description: businessData.description,
          address: businessData.address,
          phone: businessData.phone,

          owner: {
            connect: { id: user.id },
          },

          category: {
            connect: { id: businessData.categoryId },
          },

          workingHours: formattedWorkingHours,
        },
      });
      return business;
    } catch (error: any) {
      throw new Error(`Erro ao criar negócio: ${error.message}`);
    }
  }

  async getBusinessByOwnerUid(firebaseUid: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { firebaseUid },
      });

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      const business = await prisma.business.findFirst({
        where: { ownerId: user.id },
        include: {
          owner: true,
          category: true,
          services: true,
        },
      });

      return business;
    } catch (error: any) {
      throw new Error(
        `Erro ao buscar negócio pelo ID do proprietário: ${error.message}`
      );
    }
  }

  async getBusinessById(businessId: string) {
    try {
      if (businessId.length > 24 || /[^0-9a-fA-F]/.test(businessId)) {
        return this.getBusinessByOwnerUid(businessId);
      }

      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          owner: true,
          category: true,
          services: true,
        },
      });
      return business;
    } catch (error: any) {
      throw new Error(`Erro ao buscar negócio: ${error.message}`);
    }
  }

  async getAllBusinesses() {
    try {
      const businesses = await prisma.business.findMany({
        include: {
          owner: true,
          category: true,
          services: true,
        },
      });
      return businesses;
    } catch (error: any) {
      throw new Error(`Erro ao buscar negócios: ${error.message}`);
    }
  }

  async updateBusiness(businessId: string, businessData: any) {
    try {
      if (businessId.length > 24 || /[^0-9a-fA-F]/.test(businessId)) {
        const user = await prisma.user.findUnique({
          where: { firebaseUid: businessId },
        });

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        const business = await prisma.business.findFirst({
          where: { ownerId: user.id },
        });

        if (!business) {
          throw new Error("Negócio não encontrado");
        }

        businessId = business.id; // Use o ID do MongoDB para o restante da função
      }

      const existingBusiness = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!existingBusiness) {
        throw new Error("Negócio não encontrado");
      }

      let updateData = { ...businessData };

      delete updateData.image;

      if (businessData.image) {
        const existingImageId = extractDriveIdFromUrl(
          existingBusiness.imageUrl
        );
        if (existingImageId) {
          await deleteFromDrive(existingImageId);
        }
        updateData.imageUrl = await uploadToDrive(businessData.image);
      }

      const updatedBusiness = await prisma.business.update({
        where: { id: businessId },
        data: updateData,
      });
      return updatedBusiness;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar negócio: ${error.message}`);
    }
  }

  async deleteBusiness(businessId: string) {
    try {
      // Verifica se o businessId é um possível Firebase UID
      if (businessId.length > 24 || /[^0-9a-fA-F]/.test(businessId)) {
        // Se parece um Firebase UID, primeiro pegamos o usuário
        const user = await prisma.user.findUnique({
          where: { firebaseUid: businessId },
        });

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        // Encontra o negócio associado a este usuário
        const business = await prisma.business.findFirst({
          where: { ownerId: user.id },
        });

        if (!business) {
          throw new Error("Negócio não encontrado");
        }

        businessId = business.id; // Use o ID do MongoDB para o restante da função
      }

      const existingBusiness = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!existingBusiness) {
        throw new Error("Negócio não encontrado");
      }

      const existingImageId = extractDriveIdFromUrl(existingBusiness.imageUrl);
      if (existingImageId) {
        await deleteFromDrive(existingImageId);
      }

      const deletedBusiness = await prisma.business.delete({
        where: { id: businessId },
      });

      return deletedBusiness;
    } catch (error: any) {
      throw new Error(`Erro ao deletar negócio: ${error.message}`);
    }
  }

  async getBusinessStats(businessId: string) {
    try {
      // Verifica se o businessId é um possível Firebase UID
      if (businessId.length > 24 || /[^0-9a-fA-F]/.test(businessId)) {
        // Se parece um Firebase UID, primeiro pegamos o usuário e depois o negócio
        const user = await prisma.user.findUnique({
          where: { firebaseUid: businessId },
        });

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        // Encontra o negócio associado a este usuário
        const business = await prisma.business.findFirst({
          where: { ownerId: user.id },
          select: {
            id: true,
            name: true,
          },
        });

        if (!business) {
          throw new Error("Negócio não encontrado");
        }

        businessId = business.id; // Use o ID do MongoDB para o restante da função
      } else {
        // Verificar se o negócio existe com o ID do MongoDB
        const existingBusiness = await prisma.business.findUnique({
          where: { id: businessId },
          select: {
            id: true,
            name: true,
          },
        });

        if (!existingBusiness) {
          throw new Error("Negócio não encontrado");
        }
      }

      // Agora buscamos os agendamentos com o businessId correto (já convertido para ID MongoDB se necessário)
      const appointments = await prisma.appointment.findMany({
        where: { businessId },
        include: {
          service: {
            select: {
              price: true,
            },
          },
        },
      });

      // Obtém o negócio novamente para ter certeza que estamos usando o ID correto
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
        },
      });

      let totalAppointments = appointments.length;
      let pendingAppointments = appointments.filter(
        (app) => app.status === "pendente"
      ).length;
      let completedAppointments = appointments.filter(
        (app) => app.status === "confirmado"
      ).length;

      let totalRevenue = appointments
        .filter((app) => app.status === "confirmado")
        .reduce((acc, curr) => acc + curr.service.price, 0);

      const uniqueClientIds = new Set(
        appointments
          .filter((app) => app.status === "confirmado")
          .map((app) => app.clientId)
      );
      let clientsServed = uniqueClientIds.size;

      return {
        businessId: business?.id || businessId,
        name: business?.name || "Negócio",
        stats: {
          totalAppointments,
          pendingAppointments,
          completedAppointments,
          totalRevenue,
          clientsServed,
        },
      };
    } catch (error: any) {
      throw new Error(
        `Erro ao obter estatísticas do negócio: ${error.message}`
      );
    }
  }
}

export default new BusinessService();
