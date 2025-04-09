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
}

export default new AppointmentController();
