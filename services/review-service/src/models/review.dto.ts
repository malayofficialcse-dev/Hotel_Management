import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RatingsBreakdownDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanliness?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  comfort?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  location?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  service?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  valueForMoney?: number;
}

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsOptional()
  @IsString()
  userAvatar?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RatingsBreakdownDto)
  ratingsBreakdown?: RatingsBreakdownDto;

  @IsOptional()
  @IsDateString()
  stayDate?: string;

  @IsOptional()
  @IsString()
  bookingCode?: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RatingsBreakdownDto)
  ratingsBreakdown?: RatingsBreakdownDto;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}
