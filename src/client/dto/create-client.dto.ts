import { IsNotEmpty, IsString } from "class-validator";

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    folderId: number;

    orderDigital?: boolean;
  }