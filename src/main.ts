import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: ["https://app-course-hub.hardbanrecordslab.online", "https://hardbanrecordslab.online"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  const PORT = parseInt(process.env.PORT || "9104", 10);
  await app.listen(PORT, "0.0.0.0");
  console.log(`[course-hub] NestJS running on http://0.0.0.0:${PORT}`);
}
bootstrap();