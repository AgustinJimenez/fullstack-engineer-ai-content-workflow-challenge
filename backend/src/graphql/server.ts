import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
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
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              // Cleanup subscriptions on shutdown
            },
          };
        },
      },
    ],
  });
}

/**
 * Setup WebSocket server for GraphQL subscriptions
 * Call this after creating the HTTP server
 */
export function setupSubscriptions(httpServer: any, schema: any) {
  return SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: (connectionParams: any) => {
        console.log('🔌 GraphQL subscription client connected');
        return { connectionParams };
      },
      onDisconnect: () => {
        console.log('🔌 GraphQL subscription client disconnected');
      },
    },
    {
      server: httpServer,
      path: '/graphql',
    }
  );
}