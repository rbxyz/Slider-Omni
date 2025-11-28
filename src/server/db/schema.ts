// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `slider-omni_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const llmProviders = createTable(
  "llm_provider",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    /**
     * Identificador do provedor de LLM.
     * Exemplos: "azure", "openrouter".
     */
    provider: d.varchar({ length: 32 }).notNull(),
    /**
     * API key do provedor.
     */
    apiKey: d.varchar({ length: 512 }).notNull(),
    /**
     * Base URL genérica (usada, por exemplo, para OpenRouter).
     */
    baseUrl: d.varchar({ length: 512 }),
    /**
     * Nome do modelo (por exemplo, para OpenRouter).
     */
    model: d.varchar({ length: 128 }),
    /**
     * Campos específicos da Azure.
     */
    azureEndpoint: d.varchar({ length: 512 }),
    azureDeploymentName: d.varchar({ length: 256 }),
    azureApiVersion: d.varchar({ length: 64 }),
    /**
     * Indica qual configuração está ativa na aplicação.
     */
    isActive: d.boolean().notNull().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("llm_provider_idx").on(t.provider), uniqueIndex("llm_provider_provider_unique").on(t.provider)],
);

export const users = createTable(
  "user",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    username: d.varchar({ length: 64 }).notNull(),
    email: d.varchar({ length: 255 }).notNull(),
    passwordHash: d.varchar({ length: 256 }).notNull(),
    salt: d.varchar({ length: 64 }).notNull(),
    // store permissions as text containing JSON to avoid migration issues with JSON defaults
    permissions: d.text().notNull().default('{}'), // Corrigido
    omnitokens: d.integer().notNull().default(10),
    omnicoins: d.integer().notNull().default(45),
    lastReset: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [uniqueIndex("user_username_unique").on(t.username)],
)

export const presentations = createTable(
  "presentation",
  (d) => ({
    id: d.varchar({ length: 128 }).primaryKey(),
    userId: d.integer().references(() => users.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 256 }),
    description: d.text(),
    html: d.text(),
    slideCount: d.integer(),
    slides: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("presentation_created_idx").on(t.createdAt),
    index("presentation_user_idx").on(t.userId),
  ],
)