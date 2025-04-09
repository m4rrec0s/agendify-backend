import prisma from "../database";

interface CreateCategoryInput {
  name: string;
}

class CategoryService {
  async createCategory({ name }: CreateCategoryInput) {
    try {
      const existingCategory = await prisma.category.findFirst({
        where: { name },
      });

      if (existingCategory) {
        throw new Error("Categoria já existe");
      }

      const category = await prisma.category.create({
        data: {
          name,
        },
      });

      return category;
    } catch (error: any) {
      throw new Error(`Erro ao criar categoria: ${error.message}`);
    }
  }

  async getCategories() {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });

      return categories;
    } catch (error: any) {
      throw new Error(`Erro ao obter categorias: ${error.message}`);
    }
  }

  async getCategoryById(id: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new Error("Categoria não encontrada");
      }

      return category;
    } catch (error: any) {
      throw new Error(`Erro ao obter categoria: ${error.message}`);
    }
  }

  async updateCategory(id: string, name: string) {
    try {
      const category = await prisma.category.update({
        where: { id },
        data: { name },
      });

      return category;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar categoria: ${error.message}`);
    }
  }

  async deleteCategory(id: string) {
    try {
      await prisma.category.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new Error(`Erro ao deletar categoria: ${error.message}`);
    }
  }
}

export default new CategoryService();
