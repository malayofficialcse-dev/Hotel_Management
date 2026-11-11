import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  avatarUrl?: string;

  @IsOptional()
  city?: string;
}

export class AddWishlistDto {
  @IsNotEmpty()
  hotelId: string;

  @IsNotEmpty()
  hotelName: string;

  @IsNotEmpty()
  hotelCity: string;

  @IsNotEmpty()
  image: string;

  @IsNotEmpty()
  price: number;
}

