import { Router } from 'express';
import { ProductsController } from './products.controller';

const router = Router();
const controller = new ProductsController();

router.get('/', controller.getAllProducts);
router.post('/update', controller.updateProducts);
router.get('/:id', controller.getProductById);

export default router;
