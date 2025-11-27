import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Min } from 'class-validator';

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

  // ✅ relación con categoría
  @IsUUID()
  categoryId: string;
}
