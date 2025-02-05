import { Router } from 'express'
import { addProductController } from '../../use-cases/implementations/add-product'
import { deleteProductController } from '../../use-cases/implementations/delete-product'
import { editProductController } from '../../use-cases/implementations/edit-product'
import { findProductController } from '../../use-cases/implementations/find-product'
import { adaptRoute } from '../adapters/express/express-route-adapter'

const productRouter = Router()

productRouter.post('/', adaptRoute(addProductController))
productRouter.put('/:sku', adaptRoute(editProductController))
productRouter.get('/:sku', adaptRoute(findProductController))
productRouter.delete('/:sku', adaptRoute(deleteProductController))

export { productRouter }
