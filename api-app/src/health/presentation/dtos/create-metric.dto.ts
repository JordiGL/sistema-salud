import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsString,
  Matches,
  IsIn,
} from 'class-validator';

// Definimos las opciones válidas para evitar datos basura
const CONTEXT_OPTIONS = ['exercise', 'drainage', 'chemo', 'stress'];
const WEIGHT_LOCATIONS = ['home', 'pharmacy', 'cap', 'ico'];

export class CreateMetricDto {
  // Regex: Busca digitos, una barra, digitos (ej: 120/80)
  @IsOptional()
  @IsString()
  @Matches(/^\d+\/\d+$/, { message: 'La tensión debe tener formato "120/80"' })
  bloodPressure?: string;

  @IsOptional()
  @IsString()
  @IsIn(CONTEXT_OPTIONS, { message: 'Contexto no válido' })
  measurementContext?: string;

  @IsOptional()
  @IsString()
  @IsIn(WEIGHT_LOCATIONS, { message: 'Lugar de peso no válido' })
  weightLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(250)
  pulse?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  spo2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ca125?: number;
}
