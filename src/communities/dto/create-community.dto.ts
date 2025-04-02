import {
    IsNotEmpty,
    IsString,
  } from 'class-validator';
  
  export class CreateCommunityDto {
    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    homePhoto: string;

    @IsString()
    description: string;
  }