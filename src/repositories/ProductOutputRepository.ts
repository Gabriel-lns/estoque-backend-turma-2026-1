import Database from "better-sqlite3";
import { InfrastructureError } from "../InfrastructureError";
import { Product } from "../entities/Product";
import { ProductOutput } from "../entities/ProductOutput";
import type { SqliteConnection } from "./SqliteConnection";

export interface ProductOutputRepositoryInterface {
    create(productOutput: ProductOutput): void | InfrastructureError;
}

// Interface segregada para operacoes de exclusao (ISP)
export interface ProductOutputDeletionRepositoryInterface {
    findById(id: string): ProductOutput | null | InfrastructureError;
    delete(id: string): void | InfrastructureError;
}

export class ProductOutputRepository implements ProductOutputRepositoryInterface, ProductOutputDeletionRepositoryInterface {
    constructor(private readonly sqliteConnection: SqliteConnection) {}

    public create(productOutput: ProductOutput): void | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            connection.prepare(
                "INSERT INTO product_outputs (id, product_id, quantity, output_date) VALUES (?, ?, ?, ?)",
            ).run(
                productOutput.getId(),
                productOutput.getProduct().getBarcode(),
                productOutput.getQuantity(),
                productOutput.getOutputDate().toISOString(),
            );
        } catch {
            return new InfrastructureError("Failed to create product output");
        }
    }

    // Busca a saida trazendo tambem o produto associado via join
    public findById(id: string): ProductOutput | null | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            const statement = connection.prepare(
                `SELECT po.id, po.quantity, po.output_date,
                        p.barcode, p.name, p.quantity_in_stock
                   FROM product_outputs po
                   JOIN products p ON p.barcode = po.product_id
                  WHERE po.id = ?`
            );
            const row = statement.get(id) as ProductOutputRow | undefined;

            if (!row) {
                return null;
            }

            return this.toEntity(row);
        } catch {
            return new InfrastructureError("Failed to find product output");
        }
    }

    public delete(id: string): void | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            connection.prepare("DELETE FROM product_outputs WHERE id = ?").run(id);
        } catch {
            return new InfrastructureError("Failed to delete product output");
        }
    }

    // Converte os dados do sqlite para a entidade
    private toEntity(row: ProductOutputRow): ProductOutput {
        const product = Product.rebuild(row.barcode, row.name, row.quantity_in_stock);
        return ProductOutput.rebuild(row.id, product, row.quantity, new Date(row.output_date));
    }
}

interface ProductOutputRow {
    id: string;
    quantity: number;
    output_date: string;
    barcode: string;
    name: string;
    quantity_in_stock: number;
}