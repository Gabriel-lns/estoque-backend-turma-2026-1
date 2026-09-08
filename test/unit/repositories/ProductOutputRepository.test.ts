import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";
import { InfrastructureError } from "../../../src/InfrastructureError";
import { ProductOutputRepository } from "../../../src/repositories/ProductOutputRepository";
import { ProductRepository } from "../../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../../src/repositories/SqliteConnection";

describe("ProductOutputRepository tests", () => {
    const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");

    // Limpa as tabelas respeitando a ordem de foreign keys
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

    // Testa persistencia de nova saida
    test("should create a product output", () => {
        const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
        const productRepository = new ProductRepository(sqliteConnection);
        const outputRepository = new ProductOutputRepository(sqliteConnection);

        productRepository.create(product);

        const date = new Date("2026-08-20T10:00:00.000Z");
        const output = ProductOutput.create(product, 10, date);

        expect(output).toBeInstanceOf(ProductOutput);
        if (output instanceof Error) return;

        const result = outputRepository.create(output);
        expect(result).toBeUndefined();

        const row = sqliteConnection.getConnection()
            .prepare("SELECT id, product_id, quantity, output_date FROM product_outputs WHERE id = ?")
            .get(output.getId()) as { id: string; product_id: string; quantity: number; output_date: string };

        expect(row).toEqual({
            id: output.getId(),
            product_id: product.getBarcode(),
            quantity: 10,
            output_date: date.toISOString(),
        });
    });

    // Simula falha de conexao/preparacao no create
    test("should return an infrastructure error when creating an output fails", () => {
        const outputRepository = new ProductOutputRepository({
            getConnection: () => ({
                prepare: () => {
                    throw new Error("database unavailable");
                },
            }),
        } as any);

        const result = outputRepository.create({
            getId: () => "id",
            getProduct: () => ({ getBarcode: () => "barcode" }),
            getQuantity: () => 5,
            getOutputDate: () => new Date(),
        } as any);

        expect(result).toEqual(new InfrastructureError("Failed to create product output"));
    });

    // Testa busca com join e remocao da saida
    test("should find output by ID and delete an output", () => {
        const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
        const productRepository = new ProductRepository(sqliteConnection);
        const outputRepository = new ProductOutputRepository(sqliteConnection);

        productRepository.create(product);

        const date = new Date("2026-08-20T10:00:00.000Z");
        const output = ProductOutput.rebuild("output-id-1", product, 15, date);
        outputRepository.create(output);

        const found = outputRepository.findById("output-id-1");
        expect(found).toBeInstanceOf(ProductOutput);
        if (!(found instanceof ProductOutput)) return;

        expect(found.getId()).toBe("output-id-1");
        expect(found.getQuantity()).toBe(15);
        expect(found.getOutputDate()).toEqual(date);
        expect(found.getProduct().getBarcode()).toBe("1234567890123");
        expect(found.getProduct().getName()).toBe("Biscoito Recheado");
        expect(found.getProduct().getQuantityInStock()).toBe(100);

        expect(outputRepository.findById("non-existent-id")).toBeNull();

        const deleteResult = outputRepository.delete("output-id-1");
        expect(deleteResult).toBeUndefined();
        expect(outputRepository.findById("output-id-1")).toBeNull();
    });

    // Valida captura de erro no findById e delete
    test("should return infrastructure errors when findById and delete fail", () => {
        const failingRepository = new ProductOutputRepository({
            getConnection: () => ({
                prepare: () => {
                    throw new Error("database error");
                },
            }),
        } as any);

        expect(failingRepository.findById("any-id")).toEqual(
            new InfrastructureError("Failed to find product output"),
        );
        expect(failingRepository.delete("any-id")).toEqual(
            new InfrastructureError("Failed to delete product output"),
        );
    });
});
