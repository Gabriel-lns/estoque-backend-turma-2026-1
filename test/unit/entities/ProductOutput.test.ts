import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";

describe("ProductOutput entity tests", () => {
    const validProduct = Product.rebuild("1234567890123", "Produto Teste", 100);

    // Valida criacao regular de uma nova saida
    test("should create a product output successfully", () => {
        const date = new Date("2026-08-20T10:00:00.000Z");
        const output = ProductOutput.create(validProduct, 10, date);

        expect(output).toBeInstanceOf(ProductOutput);
        if (output instanceof Error) return;

        expect(output.getId()).toBeDefined();
        expect(output.getProduct()).toBe(validProduct);
        expect(output.getQuantity()).toBe(10);
        expect(output.getOutputDate()).toEqual(date);
    });

    // Valida reconstituição da entidade vinda do banco (sem gerar novo ID ou revalidar regras)
    test("should rebuild an existing product output", () => {
        const date = new Date("2026-08-20T10:00:00.000Z");
        const output = ProductOutput.rebuild("custom-id", validProduct, 15, date);

        expect(output).toBeInstanceOf(ProductOutput);
        expect(output.getId()).toBe("custom-id");
        expect(output.getProduct()).toBe(validProduct);
        expect(output.getQuantity()).toBe(15);
        expect(output.getOutputDate()).toEqual(date);
    });

    // Testes de validacao de campos e regras de borda
    test("should fail when product is missing", () => {
        const date = new Date();
        const result = ProductOutput.create(null as any, 5, date);

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe("Product is required");
    });

    test("should fail when quantity is zero or negative", () => {
        const date = new Date();

        const resultZero = ProductOutput.create(validProduct, 0, date);
        expect(resultZero).toBeInstanceOf(Error);
        expect((resultZero as Error).message).toBe("Quantity must be a positive integer");

        const resultNegative = ProductOutput.create(validProduct, -5, date);
        expect(resultNegative).toBeInstanceOf(Error);
        expect((resultNegative as Error).message).toBe("Quantity must be a positive integer");
    });

    test("should fail when quantity is not an integer", () => {
        const date = new Date();
        const result = ProductOutput.create(validProduct, 2.5, date);

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe("Quantity must be a positive integer");
    });

    test("should fail when quantity exceeds available stock", () => {
        const lowStockProduct = Product.rebuild("123", "Produto Baixo Estoque", 5);
        const date = new Date();
        const result = ProductOutput.create(lowStockProduct, 10, date);

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe("Insufficient stock for the requested output quantity");
    });

    test("should fail when output date is invalid or missing", () => {
        const resultMissing = ProductOutput.create(validProduct, 5, null as any);
        expect(resultMissing).toBeInstanceOf(Error);
        expect((resultMissing as Error).message).toBe("Invalid output date");

        const resultInvalid = ProductOutput.create(validProduct, 5, new Date("invalid date"));
        expect(resultInvalid).toBeInstanceOf(Error);
        expect((resultInvalid as Error).message).toBe("Invalid output date");
    });
});
