import { InfrastructureError } from "../InfrastructureError";
import type { ProductOutputDeletionRepositoryInterface } from "../repositories/ProductOutputRepository";
import type { ProductStockRepositoryInterface } from "../repositories/ProductRepository";

export interface DeleteProductOutputUsecaseInterface {
    execute(productOutputId: string): void | Error;
}

export class DeleteProductOutputUsecase implements DeleteProductOutputUsecaseInterface {
    constructor(
        private readonly productOutputRepository: ProductOutputDeletionRepositoryInterface,
        private readonly productStockRepository: ProductStockRepositoryInterface,
    ) {}

    public execute(productOutputId: string): void | Error {
        if (!productOutputId || productOutputId.trim() === "") {
            return new Error("Product output ID is required");
        }

        const productOutput = this.productOutputRepository.findById(productOutputId);
        if (productOutput instanceof InfrastructureError) {
            return productOutput;
        }

        if (!productOutput) {
            return new Error("Product output not found");
        }

        const product = productOutput.getProduct();
        if (!product) {
            return new Error("Product not found");
        }

        // Ao excluir uma saida, a quantidade retorna para o estoque (estorno)
        const newStock = product.getQuantityInStock() + productOutput.getQuantity();

        // Remove a saida e atualiza o estoque do produto
        const deleteResult = this.productOutputRepository.delete(productOutputId);
        if (deleteResult instanceof InfrastructureError) {
            return deleteResult;
        }

        const stockResult = this.productStockRepository.updateStock(product.getBarcode(), newStock);
        if (stockResult instanceof InfrastructureError) {
            return stockResult;
        }
    }
}
