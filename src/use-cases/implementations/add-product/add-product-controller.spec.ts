import { Either, left, right } from '../../../core/either'
import { ProductAlreadyExistsError } from '../../../domain/errors/product-already-exists'
import { IAddProductUseCase, AddProductDTO, CreatedProduct } from '../../../domain/use-cases/add-product'
import { InvalidParamError, MissingParamError } from '../../../presentation/errors'
import { badRequest, ok, serverError } from '../../../presentation/helpers/http-helper'
import { IController } from '../../../presentation/protocols/controller'
import { IHttpRequest } from '../../../presentation/protocols/http'
import { AddProductController } from './add-product-controller'

const makeAddProductUseCase = (): IAddProductUseCase => {
  class AddProductUseCaseStub implements IAddProductUseCase {
    async execute ({ sku, name, warehouses }: AddProductDTO): Promise<Either<ProductAlreadyExistsError, CreatedProduct>> {
      return new Promise(resolve => resolve(right(makeFakeCreatedProduct())))
    }
  }
  return new AddProductUseCaseStub()
}

const makeFakeCreatedProduct = (): CreatedProduct => ({
  sku: 1,
  name: 'any_name',
  inventory: {
    warehouses: [
      {
        locality: 'ANY_LOCALITY',
        quantity: 1,
        type: 'ANY_TYPE'
      }
    ]
  }
})

const makeFakeSutRequest = (): IHttpRequest => ({
  body: {
    sku: 1,
    name: 'any_name',
    inventory: {
      warehouses: [{
        locality: 'any_locality',
        quantity: 1,
        type: 'any_type'
      }]
    }
  }
})

const makeFakeAddProductDTO = (): AddProductDTO => ({
  sku: 1,
  name: 'any_name',
  warehouses: [{
    locality: 'any_locality',
    quantity: 1,
    type: 'any_type'
  }]
})

type SutTypes = {
  addProductUseCaseStub: IAddProductUseCase
  sut: IController
}
const makeSut = (): SutTypes => {
  const addProductUseCaseStub = makeAddProductUseCase()
  const sut = new AddProductController(addProductUseCaseStub)

  return {
    addProductUseCaseStub,
    sut
  }
}

describe('AddProduct Controller', () => {
  test('should call AddProductUseCase with correct params', async () => {
    const { sut, addProductUseCaseStub } = makeSut()
    const executeSpy = jest.spyOn(addProductUseCaseStub, 'execute')
    await sut.handle(makeFakeSutRequest())

    expect(executeSpy).toHaveBeenCalledWith(makeFakeAddProductDTO())
  })

  test('should return 500 if AddProductUseCase throws', async () => {
    const { sut, addProductUseCaseStub } = makeSut()
    jest.spyOn(addProductUseCaseStub, 'execute').mockReturnValueOnce(
      new Promise((resolve, reject) => reject(new Error()))
    )
    const response = await sut.handle(makeFakeSutRequest())

    expect(response).toEqual(serverError('internal'))
  })

  test('should return badRequest if any of requiredParams is not provided', async () => {
    const { sut } = makeSut()
    const missingSku = await sut.handle({
      ...makeFakeSutRequest(),
      body: {
        name: 'any_name',
        inventory: {}
      }
    })

    const missingName = await sut.handle({
      ...makeFakeSutRequest(),
      body: {
        sku: 'any_sku',
        inventory: {}
      }
    })

    expect(missingSku).toEqual(badRequest(new MissingParamError('sku')))
    expect(missingName).toEqual(
      badRequest(new MissingParamError('name'))
    )
  })

  test('should return badRequest if warehouse is missing or empty', async () => {
    const { sut } = makeSut()

    const emptyWarehouses = await sut.handle({
      body: {
        ...makeFakeSutRequest().body,
        inventory: {
          warehouses: []
        }
      }
    })

    const missingWarehouses = await sut.handle({
      body: {
        ...makeFakeSutRequest().body,
        inventory: {}
      }
    })

    expect(emptyWarehouses).toEqual(badRequest(new MissingParamError('warehouse')))
    expect(missingWarehouses).toEqual(badRequest(new MissingParamError('warehouse')))
  })

  test('should return badRequest if warehouse is invalid', async () => {
    const { sut } = makeSut()
    const response = await sut.handle({
      body: {
        ...makeFakeSutRequest().body,
        inventory: {
          warehouses: [
            {
              quantity: 1
            }
          ]
        }
      }
    })

    expect(response).toEqual(badRequest(new InvalidParamError('warehouse', 'warehouse')))
  })

  test('should return badRequest if quantity is not a number', async () => {
    const { sut } = makeSut()
    const response = await sut.handle({
      body: {
        ...makeFakeSutRequest().body,
        inventory: {
          warehouses: [
            {
              locality: 'any_locality',
              quantity: 'not a number',
              type: 'any_type'
            }
          ]
        }
      }
    })

    expect(response).toEqual(badRequest(new InvalidParamError('quantity', 'number')))
  })

  test('should return 400 if AddProductUseCase returns left', async () => {
    const { sut, addProductUseCaseStub } = makeSut()
    jest.spyOn(addProductUseCaseStub, 'execute').mockReturnValueOnce(
      new Promise(resolve => resolve(left(new ProductAlreadyExistsError())))
    )
    const response = await sut.handle(makeFakeSutRequest())

    expect(response).toEqual(badRequest(new ProductAlreadyExistsError()))
  })

  test('should return 200 on success', async () => {
    const { sut } = makeSut()
    const response = await sut.handle(makeFakeSutRequest())

    expect(response).toEqual(ok(makeFakeCreatedProduct()))
  })
})
