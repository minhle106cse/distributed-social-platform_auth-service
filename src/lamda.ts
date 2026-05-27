import awsLambdaFastify from '@fastify/aws-lambda'
import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { createApp } from './app'

type LambdaHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<unknown>

let proxy: LambdaHandler

function bootstrap(): LambdaHandler {
  const app = createApp()

  return awsLambdaFastify(app) as LambdaHandler
}

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
  if (!proxy) {
    proxy = bootstrap()
  }

  return proxy(event, context)
}
