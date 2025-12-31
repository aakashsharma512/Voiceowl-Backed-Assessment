import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import {
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
  MIN_PAGINATION_LIMIT,
} from '../../common/constants/app.constants';

export class QueryParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PAGINATION_LIMIT)
  @Max(MAX_PAGINATION_LIMIT)
  limit?: number = DEFAULT_PAGINATION_LIMIT;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

