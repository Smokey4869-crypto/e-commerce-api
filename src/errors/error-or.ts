import { HttpException } from "@nestjs/common";

export type ErrorOr<T> = { data: T; error?: never } | { data?: never; error: Error };

