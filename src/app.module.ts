import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'salchichon1',
      database: 'bank_app',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // TODO solo en dev
    }),
    UsersModule,
    AuthModule
  ],
})
export class AppModule {}
