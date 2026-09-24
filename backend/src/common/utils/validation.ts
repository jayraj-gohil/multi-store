import type {
  FastifySchemaCompiler,
  FastifySerializerCompiler,
  FastifyTypeProvider,
} from 'fastify';
import type { z, ZodType } from 'zod';

/**
 * Lets routes declare Zod schemas in `schema: { body, querystring, params, response }`.
 * Fastify validates the request with them and infers the handler's types.
 *
 * Usage in a module: `const r = app.withTypeProvider<ZodTypeProvider>();`
 */
export interface ZodTypeProvider extends FastifyTypeProvider {
  validator: this['schema'] extends ZodType ? z.output<this['schema']> : unknown;
  serializer: this['schema'] extends ZodType ? z.input<this['schema']> : unknown;
}

// A failed parse returns the ZodError; Fastify tags it with statusCode 400 and
// validationContext ('body' | 'querystring' | 'params' | 'headers') for the error handler.
export const validatorCompiler: FastifySchemaCompiler<ZodType> =
  ({ schema }) =>
  (data) => {
    const result = schema.safeParse(data);
    return result.success ? { value: result.data } : { error: result.error };
  };

// Response schemas strip unknown fields (e.g. a password hash) before sending.
export const serializerCompiler: FastifySerializerCompiler<ZodType> =
  ({ schema }) =>
  (data) =>
    JSON.stringify(schema.parse(data));
