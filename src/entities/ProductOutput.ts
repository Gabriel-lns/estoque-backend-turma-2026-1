import { Product } from "./Product";

export class ProductOutput {
    private constructor(
        private readonly id: string,
        private readonly product: Product,
        private readonly quantity: number,
        private readonly outputDate: Date,
    ) {}

    public static create(
        product: Product,
        quantity: number,
        outputDate: Date,
    ): ProductOutput | Error {
        if (!product) {
            return new Error("Product is required");
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return new Error("Quantity must be a positive integer");
        }
        if (quantity > product.getQuantityInStock()) {
            return new Error("Insufficient stock for the requested output quantity");
        }
        if (!outputDate || isNaN(outputDate.getTime())) {
            return new Error("Invalid output date");
        }

        return new ProductOutput(crypto.randomUUID(), product, quantity, outputDate);
    }

    // Reconstitui a entidade vinda do banco de dados
    public static rebuild(
        id: string,
        product: Product,
        quantity: number,
        outputDate: Date,
    ): ProductOutput {
        return new ProductOutput(id, product, quantity, outputDate);
    }

    public getId(): string {
        return this.id;
    }

    public getProduct(): Product {
        return this.product;
    }

    public getQuantity(): number {
        return this.quantity;
    }

    public getOutputDate(): Date {
        return this.outputDate;
    }
}