import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsString,
  Matches,
  IsIn,
} from 'class-validator';

// ARREGLAT: Usem les claus en anglès que envia el frontend
const CONTEXT_KEYS = ['exercise', 'drainage', 'chemo', 'stress'];
const LOCATION_KEYS = ['home', 'pharmacy', 'cap', 'ico'];

export class CreateMetricDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+\/\d+$/, { message: 'La tensión debe tener formato "120/80"' })
  bloodPressure?: string;

  @IsOptional()
  @IsString()
  @IsIn(CONTEXT_KEYS, {
    message: 'Contexto no válido (use keys: exercise, drainage...)',
  })
  measurementContext?: string;

  @IsOptional()
  @IsString()
  @IsIn(LOCATION_KEYS, {
    message: 'Ubicación no válida (use keys: home, pharmacy...)',
  })
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
