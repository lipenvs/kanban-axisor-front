import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    output: {
      mode: 'single',
      target: 'src/lib/api/generated.ts',
      schemas: 'src/lib/api/model',
      client: 'react-query',
      clean: true,
      biome: true,
    },
    input: {
      target: 'http://localhost:3333/openapi/json',
      filters: {
        mode: 'exclude',
        tags: ['Better Auth'],
      },
    },
  },
})
