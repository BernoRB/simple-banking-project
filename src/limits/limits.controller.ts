import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LimitsService } from './limits.service';
import { CreateOperationTypeDto } from './dto/create-operation-type.dto';
import { CreateOperationLimitDto } from './dto/create-operation-limit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Limits')
@Controller('limits')
@UseGuards(JwtAuthGuard) // TODO Por ahora con JWT, luego agrego rol admin
export class LimitsController {
  constructor(private readonly limitsService: LimitsService) {}

  @Post('operation-types')
  @ApiOperation({ summary: 'Create a new operation type' })
  @ApiResponse({ status: 201, description: 'Operation type created successfully' })
  @ApiBearerAuth()
  createOperationType(@Body() createOperationTypeDto: CreateOperationTypeDto) {
    return this.limitsService.createOperationType(createOperationTypeDto);
  }

  @Get('operation-types')
  @ApiOperation({ summary: 'Get all operation types' })
  @ApiResponse({ status: 200, description: 'Return all operation types' })
  @ApiBearerAuth()
  findAllOperationTypes() {
    return this.limitsService.findAllOperationTypes();
  }

  @Post('operation-limits')
  @ApiOperation({ summary: 'Create a new operation limit for a level' })
  @ApiResponse({ status: 201, description: 'Operation limit created successfully' })
  @ApiBearerAuth()
  createOperationLimit(@Body() createOperationLimitDto: CreateOperationLimitDto) {
    return this.limitsService.createOperationLimit(createOperationLimitDto);
  }

  @Get('operation-limits')
  @ApiOperation({ summary: 'Get all operation limits' })
  @ApiResponse({ status: 200, description: 'Return all operation limits' })
  @ApiBearerAuth()
  findAllOperationLimits() {
    return this.limitsService.findAllOperationLimits();
  }
}