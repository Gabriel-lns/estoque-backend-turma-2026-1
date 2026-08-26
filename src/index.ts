import fastify from "fastify";
import cors from "@fastify/cors";
import { SqliteConnection } from "./repositories/SqliteConnection";
import { ProductRepository } from "./repositories/ProductRepository";
import { ProductOrderRepository } from "./repositories/ProductOrderRepository";
import { ProductInputRepository } from "./repositories/ProductInputRepository";
import { ProductOutputRepository } from "./repositories/ProductOutputRepository";

import { CreateProductUsecase } from "./usecases/CreateProductUsecase";
import { CreateProductOrderUsecase } from "./usecases/CreateProductOrderUsecase";
import { CreateProductInputUsecase } from "./usecases/CreateProductInputUsecase";
import { DeleteProductInputUsecase } from "./usecases/DeleteProductInputUsecase";
import { GetAllProductsUsecase } from "./usecases/GetAllProductsUsecase";
import { GetProductUsecase } from "./usecases/GetProductUsecase";
import { GetAllProductOrdersUsecase } from "./usecases/GetAllProductOrdersUsecase";
import { GetProductOrderUsecase } from "./usecases/GetProductOrderUsecase";
import { CreateProductOutputUsecase } from "./usecases/CreateProductOutputUsecase";

import { CreateProductController } from "./controllers/CreateProductController";
import { CreateProductOrderController } from "./controllers/CreateProductOrderController";
import { CreateProductInputController } from "./controllers/CreateProductInputController";
import { DeleteProductInputController } from "./controllers/DeleteProductInputController";
import { GetAllProductsController } from "./controllers/GetAllProductsController";
import { GetProductController } from "./controllers/GetProductController";
import { GetAllProductOrdersController } from "./controllers/GetAllProductOrdersController";
import { GetProductOrderController } from "./controllers/GetProductOrderController";
import { CreateProductOutputController } from "./controllers/CreateProductOutputController";
import { DeleteProductOutputController } from "./controllers/DeleteProductOutputController";


// Instanciação da infraestrutura de banco de dados
const sqliteConnection = new SqliteConnection("db/estoque.sqlite");

// Instanciação de Repositórios aplicando inversão de dependência
const productRepository = new ProductRepository(sqliteConnection);
const productOrderRepository = new ProductOrderRepository(sqliteConnection);
const productInputRepository = new ProductInputRepository(sqliteConnection);
const productOutputRepository = new ProductOutputRepository(sqliteConnection);

// Instanciação de Casos de Uso
const createProductUsecase = new CreateProductUsecase(productRepository);
const createProductOrderUsecase = new CreateProductOrderUsecase(productRepository, productOrderRepository);
const createProductInputUsecase = new CreateProductInputUsecase(productOrderRepository, productInputRepository, productRepository);
const getAllProductsUsecase = new GetAllProductsUsecase(productRepository);
const getProductUsecase = new GetProductUsecase(productRepository);
const getAllProductOrdersUsecase = new GetAllProductOrdersUsecase(productOrderRepository);
const getProductOrderUsecase = new GetProductOrderUsecase(productOrderRepository);
const deleteProductInputUsecase = new DeleteProductInputUsecase(productInputRepository,productOrderRepository,productRepository);
const createProductOutputUsecase = new CreateProductOutputUsecase(productRepository, productOutputRepository);

// Instanciação de Adaptadores de Interface (Controllers)
const createProductController = new CreateProductController(createProductUsecase);
const createProductOrderController = new CreateProductOrderController(createProductOrderUsecase);
const createProductInputController = new CreateProductInputController(createProductInputUsecase);
const getAllProductsController = new GetAllProductsController(getAllProductsUsecase);
const getProductController = new GetProductController(getProductUsecase);
const getAllProductOrdersController = new GetAllProductOrdersController(getAllProductOrdersUsecase);
const getProductOrderController = new GetProductOrderController(getProductOrderUsecase);
const deleteProductInputController = new DeleteProductInputController(deleteProductInputUsecase);
const createProductOutputController = new CreateProductOutputController(createProductOutputUsecase);
const deleteProductOutputController = new DeleteProductOutputController();

const app = fastify();
app.register(cors, {
    origin: "*",
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Declaração de Rotas da API
app.post("/products", async (request, reply) => { 
    await createProductController.handle(request, reply); 
});

app.get("/products", async (request, reply) => { 
    await getAllProductsController.handle(request, reply); 
});

app.get("/products/:barcode", async (request, reply) => {
    await getProductController.handle(request, reply);
});

app.post("/product-orders", async (request, reply) => { 
    await createProductOrderController.handle(request, reply); 
});

app.get("/product-orders", async (request, reply) => {
    await getAllProductOrdersController.handle(request, reply);
});

app.get("/product-orders/:id", async (request, reply) => {
    await getProductOrderController.handle(request, reply);
});

app.post("/product-inputs", async (request, reply) => { 
    await createProductInputController.handle(request, reply); 
});

app.delete("/product-inputs/:productInputId", async (request, reply) => {
    await deleteProductInputController.handle(request, reply);
});
app.post("/product-outputs", async (request, reply) => { 
    await createProductOutputController.handle(request, reply); 
});

app.delete("/product-outputs/:productOutputId", async (request, reply) => {
    await deleteProductOutputController.handle(request, reply);
});

app.listen({ port: 3000 }, (err, address) => {
    if (err) {
        console.error("Error starting server:", err);
        process.exit(1);
    }
    console.log(`Server is running at ${address}`);
});
