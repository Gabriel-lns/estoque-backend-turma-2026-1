import type { FastifyRequest, FastifyReply } from "fastify";
import Database from "better-sqlite3";


export class DeleteProductOutputController {
    public async handle(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
        const { productOutputId } = request.params as { productOutputId: string; };

        if (!productOutputId) {
            return response.status(400).send({ error: "Product output ID is required" });
        }

        try {
            const connection = new Database("db/estoque.sqlite");

            const statement1 = connection.prepare("SELECT * FROM product_outputs WHERE id = ?");
            const productOutput = statement1.get(productOutputId) as { id: string; product_id: string; quantity: number; output_date: string } | undefined;

            if (!productOutput) {
                return response.status(404).send({ error: "Product output not found" });
            }

            const statement2 = connection.prepare("SELECT * FROM products WHERE barcode = ?");
            const product = statement2.get(productOutput.product_id) as { barcode: string; name: string; quantity_in_stock: number } | undefined;

            if (!product) {
                return response.status(404).send({ error: "Product not found" });
            }            

            const stock = product.quantity_in_stock;

            const deleteStatement = connection.prepare("DELETE FROM product_outputs WHERE id = ?");
            deleteStatement.run(productOutputId);

            const newStock = stock + productOutput.quantity;

            const updateProductStatement = connection.prepare("UPDATE products SET quantity_in_stock = ? WHERE barcode = ?");
            updateProductStatement.run(newStock, product.barcode);

            return response.status(200).send({ message: "Product output deleted successfully" });

        } catch (error) {
            return response.status(500).send({ error: "Internal server error" });
        }
    }
}