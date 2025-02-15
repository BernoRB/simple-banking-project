import { Controller, Post, Body, Get, Param, UseInterceptors, ClassSerializerInterceptor, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Swagger
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User has been successfully created.', type: User})
  @ApiResponse({ status: 400, description: 'Bad request.' })
  // Endpoint
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Swagger
  @ApiOperation({ summary: 'Get user by ID', description: 'Requires authentication. Use the login endpoint to get a token, then click the Authorize button and enter it as: Bearer <your-token>'})
  @ApiResponse({ status: 200, description: 'Returns the user information.', type: User})
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiBearerAuth()
  // Endpoint
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
}
