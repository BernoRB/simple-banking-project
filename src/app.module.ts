import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { LimitsModule } from './limits/limits.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OperationType } from './limits/entities/operation-type.entity';
import { OperationTypesSeed } from './seeds/operation-types.seed';
import { OperationLimit } from './limits/entities/operation-limit.entity';
import { OperationLimitsSeed } from './seeds/operation-limits.seed';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'devpw'),
        database: configService.get<string>('DB_DATABASE', 'bank_app'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV', 'development') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([OperationType, OperationLimit]),
    UsersModule,
    AuthModule,
    TransactionsModule,
    LimitsModule
  ],
  providers: [OperationTypesSeed, OperationLimitsSeed],
})
export class AppModule {}