import { Request, Response } from "express";
import categoryService from "../services/categoryService";

class CategoryController {
  async createCategory(req: Request, res: Response): Promise<void> {
    const { name } = req.body;

    try {
      const category = await categoryService.createCategory({
        name,
      });
      res.status(201).json({ category });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryService.getCategories();
      res.status(200).json({ categories });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const category = await categoryService.getCategoryById(id);
      res.status(200).json({ category });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { name } = req.body;

    try {
      const updatedCategory = await categoryService.updateCategory(id, name);
      res.status(200).json({ updatedCategory });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await categoryService.deleteCategory(id);
      res.status(204).send();
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

export default new CategoryController();
