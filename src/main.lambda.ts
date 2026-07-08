import awsLambdaFastify from '@fastify/aws-lambda'
import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { createLogger } from '@distributed-social-platform/shared-kernel'
import { createApp } from './app'
import { buildInfra } from './container/infra'
import { buildApplication } from './container/application'

type LambdaHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<unknown>

let proxy: LambdaHandler

async function bootstrap(): Promise<LambdaHandler> {
  // Own composition root for this process — Lambda has no gRPC transport,
  // so unlike main.ts there's nothing else to share this Application with.
  const logger = createLogger('auth-service')
  const infra = buildInfra(logger)
  const application = buildApplication(infra)
  const app = await createApp(application, logger)

  return awsLambdaFastify(app)
}

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  if (!proxy) {
    proxy = await bootstrap()
  }

  return proxy(event, context)
}
