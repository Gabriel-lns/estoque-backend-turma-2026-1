import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";
import { InfrastructureError } from "../../../src/InfrastructureError";
import type { ProductOutputDeletionRepositoryInterface } from "../../../src/repositories/ProductOutputRepository";
import type { ProductStockRepositoryInterface } from "../../../src/repositories/ProductRepository";
import { DeleteProductOutputUsecase } from "../../../src/usecases/DeleteProductOutputUsecase";

function makeOutput(stock = 20, outputQuantity = 5, hasProduct = true): ProductOutput {
    const product = hasProduct ? Product.rebuild("123", "Produto Teste", stock) : (null as any);
    return ProductOutput.rebuild("output-id", product, outputQuantity, new Date("2026-08-20"));
}

describe("DeleteProductOutputUsecase", () => {
    // Camada de aplicacao (Clean Architecture): o usecase nao lida com HTTP.
    // Ele retorna 'undefined' no sucesso, 'Error' para validacao/regra de negocio e 'InfrastructureError' para banco.

    // Fluxo principal (sucesso): deleta a saida e estorna o estoque (20 + 5 = 25)
    test("should delete the product output and increment stock", () => {
        const calls: string[] = [];
        const outputRepository: ProductOutputDeletionRepositoryInterface = {
            findById: () => makeOutput(20, 5),
            delete: (id) => { calls.push(`delete:${id}`); },
        };
        const stockRepository: ProductStockRepositoryInterface = {
            updateStock: (barcode, stock) => { calls.push(`stock:${barcode}:${stock}`); },
        };

        const result = new DeleteProductOutputUsecase(outputRepository, stockRepository).execute("output-id");

        expect(result).toBeUndefined();
        expect(calls).toEqual(["delete:output-id", "stock:123:25"]);
    });

    // Validacao de parametro obrigatorio
    test.each(["", "   "])("should reject an empty or whitespace ID: '%s'", (id) => {
        const outputRepository = { findById: jest.fn(), delete: jest.fn() };
        const stockRepository = { updateStock: jest.fn() };
        const usecase = new DeleteProductOutputUsecase(outputRepository, stockRepository);

        const result = usecase.execute(id);

        expect(result).toEqual(new Error("Product output ID is required"));
        expect(outputRepository.findById).not.toHaveBeenCalled();
    });

    // Validacao quando a saida nao existe no banco
    test("should return an error when the product output does not exist", () => {
        const outputRepository = { findById: () => null, delete: jest.fn() };
        const stockRepository = { updateStock: jest.fn() };
        const usecase = new DeleteProductOutputUsecase(outputRepository, stockRepository);

        const result = usecase.execute("missing-id");

        expect(result).toEqual(new Error("Product output not found"));
        expect(outputRepository.delete).not.toHaveBeenCalled();
        expect(stockRepository.updateStock).not.toHaveBeenCalled();
    });

    // Validacao defensiva caso o produto nao seja encontrado
    test("should return an error when product is not associated with output", () => {
        const outputRepository = { findById: () => makeOutput(20, 5, false), delete: jest.fn() };
        const stockRepository = { updateStock: jest.fn() };
        const usecase = new DeleteProductOutputUsecase(outputRepository, stockRepository);

        const result = usecase.execute("output-id");

        expect(result).toEqual(new Error("Product not found"));
        expect(outputRepository.delete).not.toHaveBeenCalled();
        expect(stockRepository.updateStock).not.toHaveBeenCalled();
    });

    // Testa propagacao de erro de banco em cada chamada de repositorio
    test.each(["find", "delete", "stock"])(
        "should propagate an infrastructure error from %s",
        (failurePoint) => {
            const error = new InfrastructureError("Database error");
            const usecase = new DeleteProductOutputUsecase(
                {
                    findById: () => failurePoint === "find" ? error : makeOutput(),
                    delete: () => failurePoint === "delete" ? error : undefined,
                },
                {
                    updateStock: () => failurePoint === "stock" ? error : undefined,
                },
            );

            expect(usecase.execute("output-id")).toBe(error);
        },
    );
});
