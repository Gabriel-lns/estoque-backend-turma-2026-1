import { DeleteProductOutputController } from "../../../src/controllers/DeleteProductOutputController";
import { InfrastructureError } from "../../../src/InfrastructureError";
import type { DeleteProductOutputUsecaseInterface } from "../../../src/usecases/DeleteProductOutputUsecase";

// Mock simples para simular o response do Fastify
function createResponseMock() {
    return {
        statusCode: 0,
        data: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        send(data: unknown) {
            this.data = data;
            return this;
        },
    };
}

describe("DeleteProductOutputController", () => {
    // Discriminacao dos codigos HTTP mapeados pelo controller:
    // - 200 OK: exclusao realizada e estoque estornado com sucesso (retorno undefined)
    // - 400 Bad Request: parametro invalido ou ausente (Error de validacao)
    // - 404 Not Found: registro nao encontrado no banco de dados (Error de nao encontrado)
    // - 500 Internal Server Error: falha de infraestrutura / conexao com o SQLite (InfrastructureError)
    test.each([
        [undefined, 200, { message: "Product output deleted successfully" }],
        [new Error("Product output not found"), 404, { error: "Product output not found" }],
        [new Error("Product not found"), 404, { error: "Product not found" }],
        [new Error("Product output ID is required"), 400, { error: "Product output ID is required" }],
        [new Error("Invalid deletion"), 400, { error: "Invalid deletion" }],
        [new InfrastructureError("Database error"), 500, { error: "Database error" }],
    ])("should map the usecase result to HTTP correctly", async (result, status, body) => {
        const usecase: DeleteProductOutputUsecaseInterface = { execute: () => result };
        const response = createResponseMock();
        await new DeleteProductOutputController(usecase).handle(
            { params: { productOutputId: "output-id" } } as any,
            response as any,
        );
        expect(response.statusCode).toBe(status);
        expect(response.data).toEqual(body);
    });

    // Verifica se o controller repassa o ID recebido na rota para o use case
    test("should pass the route parameter to the usecase", async () => {
        const execute = jest.fn();
        const response = createResponseMock();
        await new DeleteProductOutputController({ execute }).handle(
            { params: { productOutputId: "output-id-123" } } as any,
            response as any,
        );
        expect(execute).toHaveBeenCalledWith("output-id-123");
    });

    // Trata caso onde o parametro de rota nao foi informado
    test("should pass an empty string when the route parameter is absent", async () => {
        const execute = jest.fn(() => new Error("Product output ID is required"));
        const response = createResponseMock();
        await new DeleteProductOutputController({ execute }).handle(
            { params: {} } as any,
            response as any,
        );
        expect(execute).toHaveBeenCalledWith("");
        expect(response.statusCode).toBe(400);
    });
});
