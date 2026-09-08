import type { FastifyReply, FastifyRequest } from "fastify";
import { InfrastructureError } from "../InfrastructureError";
import type { DeleteProductOutputUsecaseInterface } from "../usecases/DeleteProductOutputUsecase";

export class DeleteProductOutputController {
    constructor(private readonly deleteProductOutputUsecase: DeleteProductOutputUsecaseInterface) {}

    public async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
        const { productOutputId } = request.params as { productOutputId?: string };
        const result = this.deleteProductOutputUsecase.execute(productOutputId ?? "");

        // Mapeia erro de banco para 500
        if (result instanceof InfrastructureError) {
            return response.status(500).send({ error: result.message });
        }

        // Mapeia 404 para nao encontrado e 400 para erro de parametro
        if (result instanceof Error) {
            const status = (result.message === "Product output not found" || result.message === "Product not found") ? 404 : 400;
            return response.status(status).send({ error: result.message });
        }

        return response.status(200).send({ message: "Product output deleted successfully" });
    }
}