import { CreateProductOrderController } from "../../src/controllers/CreateProductOrderController";
import { InfrastructureError } from "../../src/InfrastructureError";
import type { CreateProductOrderDTO } from "../../src/usecases/CreateProductOrderUsecase";

describe("Testing CreateProductOrderController", () => {

    test("should create a product order successfully", async () => {

        const requestMock: any = {
            body: {
                productBarcode: "123456",
                orderQuantity: 10
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        class CreateProductOrderUseCaseMock {
            execute(productBarcode: string, orderQuantity: number, orderDate: Date): CreateProductOrderDTO | Error {
                return {
                    id: "random-uuid",
                    productBarcode,
                    orderQuantity,
                    orderDate
                };
            }
        }

        const useCase = new CreateProductOrderUseCaseMock() as any;
        const controller = new CreateProductOrderController(useCase);

        await controller.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(201);
        expect(responseMock.data.id).toBe("random-uuid");
        expect(responseMock.data.productBarcode).toBe("123456");
        expect(responseMock.data.orderQuantity).toBe(10);
        expect(responseMock.data.orderDate).toBeInstanceOf(Date);
    });

    test("should return status 400 if request body is undefined", async () => {

        const requestMock: any = {};

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        class CreateProductOrderUseCaseMock {
            execute(): CreateProductOrderDTO | Error {
                throw new Error("Should not be called");
            }
        }

        const useCase = new CreateProductOrderUseCaseMock() as any;
        const controller = new CreateProductOrderController(useCase);

        await controller.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({
            error: "Invalid request body"
        });
    });

    test("should return status 400 if request body is not an object", async () => {

        const requestMock: any = {
            body: "invalid body"
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        class CreateProductOrderUseCaseMock {
            execute(): CreateProductOrderDTO | Error {
                throw new Error("Should not be called");
            }
        }

        const useCase = new CreateProductOrderUseCaseMock() as any;
        const controller = new CreateProductOrderController(useCase);

        await controller.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({
            error: "Invalid request body"
        });
    });

    test("should return status 500 if usecase returns InfrastructureError", async () => {

        const requestMock: any = {
            body: {
                productBarcode: "123456",
                orderQuantity: 10
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        class CreateProductOrderUseCaseMock {
            execute(): CreateProductOrderDTO | Error {
                return new InfrastructureError("Database connection failed");
            }
        }

        const useCase = new CreateProductOrderUseCaseMock() as any;
        const controller = new CreateProductOrderController(useCase);

        await controller.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(500);
        expect(responseMock.data).toEqual({
            error: "Database connection failed"
        });
    });

    test("should return status 400 if usecase returns Error", async () => {

        const requestMock: any = {
            body: {
                productBarcode: "123456",
                orderQuantity: -5
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        class CreateProductOrderUseCaseMock {
            execute(): CreateProductOrderDTO | Error {
                return new Error("A quantidade do pedido deve ser maior que zero.");
            }
        }

        const useCase = new CreateProductOrderUseCaseMock() as any;
        const controller = new CreateProductOrderController(useCase);

        await controller.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({
            error: "A quantidade do pedido deve ser maior que zero."
        });
    });

});