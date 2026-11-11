import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUrl, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsNumber()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsUrl({ require_tld: false })
  AUTH_SERVICE_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '8007', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
};

export default () => ({
  port: parseInt(process.env.PORT ?? '8007', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  authServiceUrl: process.env.AUTH_SERVICE_URL ?? 'http://localhost:8001',
});
