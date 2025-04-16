import { Business } from "@prisma/client";
import prisma from "../database";

interface AppointmentData {
  firebaseUid: string;
  appointmentData: { businessId: string; serviceId: string; date: Date };
}

interface AppointmentUpdateData {
  status?: "pendent" | "completed" | "cancelled";
  date?: Date;
}

class AppointmentService {
  async createAppointment({ firebaseUid, appointmentData }: AppointmentData) {
    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user || user.role !== "client") {
      throw new Error("Apenas clientes podem criar agendamentos");
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: appointmentData.businessId,
        serviceId: appointmentData.serviceId,
        clientId: user.id,
        date: appointmentData.date,
        status: "pendent",
      },
    });
    return appointment;
  }

  async getAppointments(firebaseUid: string) {
    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const appointments = await prisma.appointment.findMany({
      where: { clientId: user.id },
      include: {
        business: true,
        service: true,
      },
    });
    return appointments;
  }

  async getAppointmentsByBusiness(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new Error("Negócio não encontrado");
    }

    const appointments = await prisma.appointment.findMany({
      where: { businessId },
      include: {
        client: true,
        service: true,
      },
    });
    return appointments;
  }

  async getAppointmentsByClient(clientId: string) {
    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new Error("Cliente não encontrado");
    }

    const appointments = await prisma.appointment.findMany({
      where: { clientId },
      include: {
        business: true,
        service: true,
      },
    });
    return appointments;
  }

  async deleteAppointment(id: string) {
    const appointment = await prisma.appointment.delete({
      where: { id },
    });
    return appointment;
  }

  async updateAppointment(id: string, data: AppointmentUpdateData) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });
    return appointment;
  }
}

export default new AppointmentService();
