import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { EmployeeController } from "./controllers/employee.controller.js";
import { EmployeeService } from "./services/employee.service.js";
import { EmployeeRepository } from "./repository/employee.repository.js";
import { DepartmentRepository } from "./repository/department.repository.js";
import { PrismaService } from "./config/prisma.service.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository, DepartmentRepository, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: "api/v1/employees/health", method: RequestMethod.GET })
      .forRoutes(EmployeeController);
  }
}
