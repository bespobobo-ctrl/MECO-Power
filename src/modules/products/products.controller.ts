import { Request, Response } from 'express';
import { ProductsService } from './products.service';
import { sendSuccess, sendError } from '../../utils/response';

const productsService = new ProductsService();

export class ProductsController {
  async getAllProducts(req: Request, res: Response) {
    const products = await productsService.getAllProducts();
    return sendSuccess(res, 'Products catalog retrieved successfully', products);
  }

  async getProductById(req: Request, res: Response) {
    const product = await productsService.getProductById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    return sendSuccess(res, 'Product details retrieved successfully', product);
  }

  async updateProducts(req: Request, res: Response) {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return sendError(res, 'Products massivi yuborilmadi', 400);
      }
      const updated = await productsService.updateProductsBatch(products);
      return sendSuccess(res, 'Mahsulotlar narxi va rasmlari muvaffaqiyatli saqlandi!', updated);
    } catch (err: any) {
      return sendError(res, `Mahsulotlarni yangilashda xatolik: ${err.message}`, 500);
    }
  }
}
