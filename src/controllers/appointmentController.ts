import { Request, Response } from "express";
import appointmentService from "../services/appointmentService";

class AppointmentController {
  async createAppointment(req: Request, res: Response): Promise<void> {
    const firebaseUid = req.user?.uid;
    const { businessId, serviceId, date } = req.body;

    if (!firebaseUid) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    try {
      const appointment = await appointmentService.createAppointment({
        firebaseUid,
        appointmentData: {
          businessId,
          serviceId,
          date: new Date(date),
        },
      });
      res.status(201).json({ message: "Agendamento criado", appointment });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getAppointments(req: Request, res: Response): Promise<void> {
    const firebaseUid = req.user?.firebaseUid;

    if (!firebaseUid) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    try {
      const appointments = await appointmentService.getAppointments(
        firebaseUid
      );
      res.status(200).json({ appointments });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getAppointmentsByBusiness(req: Request, res: Response): Promise<void> {
    const businessId = req.params.businessId;

    if (!businessId) {
      res.status(400).json({ message: "ID do negócio não fornecido" });
      return;
    }

    try {
      const appointments = await appointmentService.getAppointmentsByBusiness(
        businessId
      );
      res.status(200).json({ appointments });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async updateAppointment(req: Request, res: Response): Promise<void> {
    const appointmentId = req.params.id;
    const { status } = req.body;

    if (!appointmentId) {
      res.status(400).json({ message: "ID do agendamento não fornecido" });
      return;
    }

    try {
      const updatedAppointment = await appointmentService.updateAppointment(
        appointmentId,
        status
      );
      res
        .status(200)
        .json({ message: "Agendamento atualizado", updatedAppointment });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async deleteAppointment(req: Request, res: Response): Promise<void> {
    const appointmentId = req.params.id;

    if (!appointmentId) {
      res.status(400).json({ message: "ID do agendamento não fornecido" });
      return;
    }

    try {
      await appointmentService.deleteAppointment(appointmentId);
      res.status(200).json({ message: "Agendamento excluído com sucesso" });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getAppointmentsByClient(req: Request, res: Response): Promise<void> {
    const clientId = req.params.clientId;

    if (!clientId) {
      res.status(400).json({ message: "ID do cliente não fornecido" });
      return;
    }

    try {
      const appointments = await appointmentService.getAppointmentsByClient(
        clientId
      );
      res.status(200).json({ appointments });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

export default new AppointmentController();
