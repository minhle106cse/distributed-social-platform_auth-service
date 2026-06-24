import awsLambdaFastify from '@fastify/aws-lambda'
import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { createApp } from './app'

type LambdaHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<unknown>

let proxy: LambdaHandler

async function bootstrap(): Promise<LambdaHandler> {
  const app = await createApp()

  return awsLambdaFastify(app)
}

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  if (!proxy) {
    proxy = await bootstrap()
  }

  return proxy(event, context)
}
