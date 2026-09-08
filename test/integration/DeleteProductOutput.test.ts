import { DeleteProductOutputController } from "../../src/controllers/DeleteProductOutputController";
import { Product } from "../../src/entities/Product";
import { ProductOutput } from "../../src/entities/ProductOutput";
import { ProductOutputRepository } from "../../src/repositories/ProductOutputRepository";
import { ProductRepository } from "../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../src/repositories/SqliteConnection";
import { DeleteProductOutputUsecase } from "../../src/usecases/DeleteProductOutputUsecase";

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

describe("DeleteProductOutput integration tests", () => {
    const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");
    const productRepository = new ProductRepository(sqliteConnection);
    const productOutputRepository = new ProductOutputRepository(sqliteConnection);
    const deleteProductOutputUsecase = new DeleteProductOutputUsecase(
        productOutputRepository,
        productRepository,
    );
    const deleteProductOutputController = new DeleteProductOutputController(
        deleteProductOutputUsecase,
    );

    // Garante isolamento do banco entre os testes
    beforeEach(() => {
        const connection = sqliteConnection.getConnection();
        connection.exec("DELETE FROM product_outputs");
        connection.exec("DELETE FROM product_inputs");
        connection.exec("DELETE FROM product_orders");
        connection.exec("DELETE FROM products");
    });

    afterEach(() => {
        const connection = sqliteConnection.getConnection();
        connection.exec("DELETE FROM product_outputs");
        connection.exec("DELETE FROM product_inputs");
        connection.exec("DELETE FROM product_orders");
        connection.exec("DELETE FROM products");
    });

    // 200 OK: fluxo completo -> persiste dados -> executa controller -> valida exclusao e estorno no SQLite
    test("should delete the product output, increment stock and verify persistence", async () => {
        const product = Product.rebuild("789123456001", "Smartphone Modelo X", 50);
        productRepository.create(product);

        const outputDate = new Date("2026-08-20T14:30:00.000Z");
        const output = ProductOutput.rebuild(
            "output-test-01",
            product,
            10,
            outputDate,
        );
        productOutputRepository.create(output);

        const requestMock = {
            params: { productOutputId: "output-test-01" },
        };
        const responseMock = createResponseMock();

        await deleteProductOutputController.handle(requestMock as any, responseMock as any);

        expect(responseMock.statusCode).toBe(200);
        expect(responseMock.data).toEqual({ message: "Product output deleted successfully" });

        // Verifica que a saida realmente foi apagada da tabela
        const outputInDb = sqliteConnection.getConnection()
            .prepare("SELECT * FROM product_outputs WHERE id = ?")
            .get("output-test-01");
        expect(outputInDb).toBeUndefined();

        // Verifica que o estoque do produto aumentou de 50 para 60 (estorno)
        const productInDb = sqliteConnection.getConnection()
            .prepare("SELECT quantity_in_stock FROM products WHERE barcode = ?")
            .get("789123456001") as { quantity_in_stock: number };
        expect(productInDb.quantity_in_stock).toBe(60);
    });

    // 404 Not Found: quando o ID da saida nao existe na tabela product_outputs
    test("should return 404 when product output does not exist", async () => {
        const requestMock = {
            params: { productOutputId: "non-existent-id" },
        };
        const responseMock = createResponseMock();

        await deleteProductOutputController.handle(requestMock as any, responseMock as any);

        expect(responseMock.statusCode).toBe(404);
        expect(responseMock.data).toEqual({ error: "Product output not found" });
    });

    // 400 Bad Request: quando o parametro da rota nao e fornecido (ausente ou vazio)
    test("should return 400 when product output ID is missing", async () => {
        const requestMock = {
            params: {},
        };
        const responseMock = createResponseMock();

        await deleteProductOutputController.handle(requestMock as any, responseMock as any);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({ error: "Product output ID is required" });
    });

    // 200 OK: garante que deletar uma saida especifica nao afeta outras saidas do mesmo produto
    test("should handle multiple outputs correctly when deleting only one", async () => {
        const product = Product.rebuild("789123456002", "Monitor 27 Polegadas", 80);
        productRepository.create(product);

        const output1 = ProductOutput.rebuild(
            "output-01",
            product,
            5,
            new Date("2026-08-10T10:00:00.000Z"),
        );
        const output2 = ProductOutput.rebuild(
            "output-02",
            product,
            15,
            new Date("2026-08-11T11:00:00.000Z"),
        );
        productOutputRepository.create(output1);
        productOutputRepository.create(output2);

        const requestMock = {
            params: { productOutputId: "output-02" },
        };
        const responseMock = createResponseMock();

        await deleteProductOutputController.handle(requestMock as any, responseMock as any);

        expect(responseMock.statusCode).toBe(200);

        // Apenas a saida 2 foi apagada, a saida 1 permanece
        expect(productOutputRepository.findById("output-02")).toBeNull();

        const remainingOutput = productOutputRepository.findById("output-01");
        expect(remainingOutput).toBeInstanceOf(ProductOutput);
        expect((remainingOutput as ProductOutput).getQuantity()).toBe(5);

        // Estoque aumentou apenas os 15 da saida 2 (80 + 15 = 95)
        const updatedProduct = productRepository.findByBarcode("789123456002");
        expect(updatedProduct).toBeInstanceOf(Product);
        expect((updatedProduct as Product).getQuantityInStock()).toBe(95);
    });
});
