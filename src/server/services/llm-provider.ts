import { createAzure } from "@ai-sdk/azure"
import { createOpenAI } from "@ai-sdk/openai"
import { type LanguageModelV1 } from "ai"
import { eq } from "drizzle-orm"

import { db } from "~/server/db"
import { llmProviders } from "~/server/db/schema"

export type LlmProviderRecord = typeof llmProviders.$inferSelect

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const DEFAULT_OPENROUTER_MODEL = "openrouter/auto"
const DEFAULT_AZURE_API_VERSION = "2024-02-15-preview"

export async function fetchActiveLlmProvider(database = db) {
  return database.query.llmProviders.findFirst({
    where: eq(llmProviders.isActive, true),
  })
}

export function createModelFromProvider(provider: LlmProviderRecord): LanguageModelV1 {
  if (provider.provider === "azure") {
    if (!provider.apiKey || !provider.azureEndpoint || !provider.azureDeploymentName) {
      throw new Error("Configuração da Azure incompleta.")
    }

    // Extrair o resource name da URL do endpoint
    // Formato esperado: https://{resourceName}.openai.azure.com
    const endpointUrl = new URL(provider.azureEndpoint)
    const resourceName = endpointUrl.hostname.split(".")[0]

    const azure = createAzure({
      apiKey: provider.apiKey,
      resourceName: resourceName,
      apiVersion: provider.azureApiVersion ?? DEFAULT_AZURE_API_VERSION,
    })

    return azure(provider.azureDeploymentName)
  }

  if (provider.provider === "openrouter") {
    if (!provider.apiKey || !provider.model) {
      throw new Error("Configuração do OpenRouter incompleta.")
    }

    const openai = createOpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL,
    })

    return openai(provider.model ?? DEFAULT_OPENROUTER_MODEL)
  }

  throw new Error(`Provedor ${provider.provider} não suportado.`)
}

