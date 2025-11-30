import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Min, IsOptional } from 'class-validator';

export class CreateProductDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  imgUrl: string;

  
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
