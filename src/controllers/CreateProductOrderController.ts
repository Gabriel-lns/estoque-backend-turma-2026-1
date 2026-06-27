import { InfrastructureError } from '../InfrastructureError';
import { CreateProductOrderUsecase } from '../usecases/CreateProductOrderUsecase';
import type { FastifyReply, FastifyRequest } from "fastify";

export class CreateProductOrderController {

    private createProductOrderUseCase: CreateProductOrderUsecase;
    
    constructor(createProductOrderUseCase: CreateProductOrderUsecase) {
        this.createProductOrderUseCase = createProductOrderUseCase;
    }

    async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if(request.body === undefined || typeof request.body !== "object") {
            reply.status(400).send({ error: "Invalid request body" });
            return;
        }
        const { productBarcode, orderQuantity } = request.body as { productBarcode: string, orderQuantity: number };

        const orderDate = new Date();

        const result = this.createProductOrderUseCase.execute(productBarcode, orderQuantity, orderDate);

        if (result instanceof InfrastructureError) {
            reply.status(500).send({ error: result.message });
            return;
        }
        
        if (result instanceof Error) {
            reply.status(400).send({ error: result.message });
            return;
        }

        reply.status(201).send({ 
            id: result.id,
            productBarcode: result.productBarcode, 
            orderQuantity: result.orderQuantity, 
            orderDate: result.orderDate
        });
    }

}