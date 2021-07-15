import { Either, left, right } from '../../../core/either'
import { IEditProductUseCase } from '../../../domain/use-cases/edit-product'
import { InvalidParamError, MissingParamError } from '../../../presentation/errors'
import { badRequest } from '../../../presentation/helpers/http-helper'
import { IController, IHttpRequest, IHttpResponse } from '../../../presentation/protocols'

export class EditProductController implements IController {
  constructor (private readonly editProductUseCase: IEditProductUseCase) {}

  async handle (request: IHttpRequest): Promise<IHttpResponse> {
    const validPayload = this.validatePayload(request.body)
    if (validPayload.isLeft()) {
      return badRequest(validPayload.value)
    }
  }

  private validatePayload (payload: any): Either<MissingParamError | InvalidParamError, void> {
    const requiredParams = ['name', 'inventory']
    for (const requiredParam of requiredParams) {
      if (!payload[requiredParam]) {
        return left(new MissingParamError(requiredParam))
      }
    }
    if (!payload.inventory.warehouses || payload.inventory.warehouses.length === 0) {
      return left(new MissingParamError('warehouse'))
    }
    for (const warehouse of payload.inventory.warehouses) {
      if (!warehouse.locality || !warehouse.quantity || !warehouse.type) {
        return left(new InvalidParamError('warehouse', 'warehouse'))
      }
    }

    return right()
  }
}
