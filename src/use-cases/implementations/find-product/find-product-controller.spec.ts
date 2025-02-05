import { Either, left, right } from '../../../core/either'
import { ProductNotFoundError } from '../../../domain/errors/product-not-found'
import { ProductModel } from '../../../domain/models/product'
import { IFindProductBySkuUseCase } from '../../../domain/use-cases/find-product-by-sku'
import { notFound, ok, serverError } from '../../../presentation/helpers/http-helper'
import { IController, IHttpRequest } from '../../../presentation/protocols'
import { FindProductController } from './find-product-controller'

const makeFindProductBySkuUseCase = (): IFindProductBySkuUseCase => {
  class FindProductBySkuUseCaseStub implements IFindProductBySkuUseCase {
    async execute (sku: number): Promise<Either<ProductNotFoundError, ProductModel>> {
      return new Promise(resolve => resolve(right(makeFakeProduct())))
    }
  }
  return new FindProductBySkuUseCaseStub()
}

const makeFakeProduct = (): ProductModel => ({
  sku: 1,
  name: 'any_name',
  inventory: {
    quantity: 1,
    warehouses: [
      {
        locality: 'any_locality',
        quantity: 1,
        type: 'any_type'
      }
    ]
  },
  isMarketable: true
})

const makeFakeRequest = (skuParam: number): IHttpRequest => ({
  params: {
    sku: skuParam
  }
})

type SutTypes = {
  findProductBySkuUseCaseStub: IFindProductBySkuUseCase
  sut: IController
}
const makeSut = (): SutTypes => {
  const findProductBySkuUseCaseStub = makeFindProductBySkuUseCase()
  const sut = new FindProductController(findProductBySkuUseCaseStub)

  return {
    findProductBySkuUseCaseStub,
    sut
  }
}

describe('FindProduct Controller', () => {
  test('should return 200 with product on success', async () => {
    const { sut } = makeSut()
    const response = await sut.handle(makeFakeRequest(1))

    expect(response).toEqual(
      ok(makeFakeProduct())
    )
  })

  test('should return 404 if FindProductBySkyUseCase return left', async () => {
    const { sut, findProductBySkuUseCaseStub } = makeSut()
    jest.spyOn(findProductBySkuUseCaseStub, 'execute').mockReturnValueOnce(new Promise(resolve => resolve(left(new ProductNotFoundError()))))
    const response = await sut.handle(makeFakeRequest(1))

    expect(response).toEqual(
      notFound(new ProductNotFoundError())
    )
  })

  test('should return 500 if FindProductBySkyUseCase throws', async () => {
    const { sut, findProductBySkuUseCaseStub } = makeSut()
    jest.spyOn(findProductBySkuUseCaseStub, 'execute').mockReturnValueOnce(new Promise((resolve, reject) => reject(new Error())))
    const response = await sut.handle(makeFakeRequest(1))

    expect(response).toEqual(
      serverError('internal')
    )
  })
})
