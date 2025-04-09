import prisma from "../database";

interface AppointmentData {
  firebaseUid: string;
  appointmentData: { businessId: string; serviceId: string; date: Date };
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

}

export default new AppointmentService();
