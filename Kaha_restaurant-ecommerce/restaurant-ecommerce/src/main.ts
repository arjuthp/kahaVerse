import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe, VersioningType } from "@nestjs/common";

import { AppModule } from "./app.module";
import { ConfigurationService } from "configuration/configuration.service";

async function bootstrap() {
  // Disable NestJS's built-in body parser so we can control the order ourselves
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigurationService);

  // Register body parsers directly on the underlying Express instance
  // This guarantees they run BEFORE any route handler
  const expressApp = app.getHttpAdapter().getInstance();
  const express = require("express");
  expressApp.use(express.json({ limit: "10mb" }));
  expressApp.use(express.urlencoded({ extended: true, limit: "10mb" }));
  expressApp.use((req, res, next) => {
    console.log(`[GLOBAL BODY LOGGER] ${req.method} ${req.path} -> body keys:`, req.body ? Object.keys(req.body) : 'UNDEFINED');
    next();
  });

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.enableCors({
    origin: ["*", "http://localhost:5173", "http://localhost:5174"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  const config = new DocumentBuilder()
    .setTitle("KAHA-Restaurant Backend API")
    .setDescription("KAHA Restaurant API Documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/v1/docs", app, document);

  await app.listen(configService.appPort);
}

bootstrap();
