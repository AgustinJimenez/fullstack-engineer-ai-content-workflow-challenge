import { ApolloServer } from 'apollo-server-express';
import { createSchema } from './schema';

export async function createApolloServer() {
  const schema = await createSchema();
  
  return new ApolloServer({
    schema,
    context: ({ req, res }) => ({
      req,
      res,
    }),
    // Enable GraphQL Playground in development
    introspection: process.env.NODE_ENV !== 'production',
  });
}