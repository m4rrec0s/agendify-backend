import { Request, Response } from "express";
import businessService from "../services/businessService";

class BusinessController {
  async createBusiness(req: Request, res: Response): Promise<void> {
    const firebaseUid = req.user?.uid;
    const { name, description, address, phone, workingHours, categoryId } =
      req.body;
    const image = req.file; // Recebendo a imagem do multer

    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    if (!firebaseUid) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Nome do negócio é obrigatório" });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ message: "Categoria do negócio é obrigatória" });
      return;
    }

    let processedWorkingHours = workingHours;

    if (
      workingHours &&
      typeof workingHours === "object" &&
      !Array.isArray(workingHours)
    ) {
      if (!workingHours.week || !workingHours.weekend) {
        res.status(400).json({
          message:
            "Formato de horários inválido. É necessário informar horários para semana (week) e fim de semana (weekend)",
        });
        return;
      }

      processedWorkingHours = [
        {
          day: "monday",
          open: workingHours.week.start,
          close: workingHours.week.end,
          timeOut: workingHours.week["time-out"] || undefined,
        },
        {
          day: "saturday",
          open: workingHours.weekend.start,
          close: workingHours.weekend.end,
        },
      ];
    } else if (!Array.isArray(workingHours) || workingHours.length === 0) {
      res.status(400).json({
        message:
          "Horário de funcionamento é obrigatório e deve ser um array ou objeto no formato correto",
      });
      return;
    }

    try {
      const business = await businessService.createBusiness({
        firebaseUid,
        businessData: {
          name,
          description,
          address,
          phone,
          workingHours: processedWorkingHours,
          categoryId,
          image, // Adicionando a imagem para o service
        },
      });
      res.status(201).json({ business });
    } catch (error: any) {
      console.error("Error creating business:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async getBusinessById(req: Request, res: Response): Promise<void> {
    const businessId = req.params.id;

    try {
      const business = await businessService.getBusinessById(businessId);
      if (!business) {
        res.status(404).json({ message: "Negócio não encontrado" });
        return;
      }
      res.status(200).json({ business });
    } catch (error: any) {
      console.error("Error fetching business:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAllBusinesses(req: Request, res: Response): Promise<void> {
    try {
      const businesses = await businessService.getAllBusinesses();
      res.status(200).json({ businesses });
    } catch (error: any) {
      console.error("Error fetching businesses:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async updateBusiness(req: Request, res: Response): Promise<void> {
    const businessId = req.params.id;
    const { name, description, address, phone, workingHours, categoryId } =
      req.body;
    const image = req.file;

    try {
      const updatedBusiness = await businessService.updateBusiness(businessId, {
        name,
        description,
        address,
        phone,
        workingHours,
        categoryId,
        image,
      });
      res.status(200).json({ updatedBusiness });
    } catch (error: any) {
      console.error("Error updating business:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async deleteBusiness(req: Request, res: Response): Promise<void> {
    const businessId = req.params.id;

    try {
      await businessService.deleteBusiness(businessId);
      res.status(200).send({ message: "Negócio deletado com sucesso" });
    } catch (error: any) {
      console.error("Error deleting business:", error);
      res.status(400).json({ message: error.message });
    }
  }
}

export default new BusinessController();
