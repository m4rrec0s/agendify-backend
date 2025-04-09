import { Request, Response } from "express";
import ServiceService from "../services/serviceService";

class ServiceController {
  async createService(req: Request, res: Response): Promise<void> {
    const firebaseUid = req.user?.uid;
    const { businessId, name, description, duration, price } = req.body;
    const image = req.file;

    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    if (!firebaseUid) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    if (!businessId || !name || !duration || !price) {
      res.status(400).json({ message: "Dados incompletos" });
      return;
    }

    try {
      const service = await ServiceService.createService(firebaseUid, {
        businessId,
        name,
        description,
        image,
        duration: Number(duration),
        price: Number(price),
      });
      res.status(201).json({ message: "Serviço criado com sucesso", service });
      return;
    } catch (error: any) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async updateService(req: Request, res: Response): Promise<void> {
    const firebaseUid = req.user?.uid;
    const serviceId = req.params.id;
    const { name, description, duration, price } = req.body;
    const image = req.file;

    console.log("Update request body:", req.body);
    console.log("Update request file:", req.file);

    if (!firebaseUid) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    try {
      const service = await ServiceService.updateService(
        firebaseUid,
        serviceId,
        {
          name,
          description,
          image,
          duration: duration ? Number(duration) : undefined,
          price: price ? Number(price) : undefined,
        }
      );
      res
        .status(200)
        .json({ message: "Serviço atualizado com sucesso", service });
      return;
    } catch (error: any) {
      console.error("Error updating service:", error);
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getService(req: Request, res: Response): Promise<void> {
    const serviceId = req.params.id;

    try {
      const service = await ServiceService.getService(serviceId);
      res.status(200).json({ service });
      return;
    } catch (error: any) {
      res.status(404).json({ message: error.message });
      return;
    }
  }

  async getServicesByBusiness(req: Request, res: Response): Promise<void> {
    const businessId = req.params.businessId;

    try {
      const services = await ServiceService.getServicesByBusiness(businessId);
      res.status(200).json({ services });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async deleteService(req: Request, res: Response): Promise<void> {
    const firebaseUid = req.user?.uid;
    const serviceId = req.params.id;

    if (!firebaseUid) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    try {
      const result = await ServiceService.deleteService(firebaseUid, serviceId);
      res.status(200).json(result);
      return;
    } catch (error: any) {
      console.error("Error deleting service:", error);
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

export default new ServiceController();
