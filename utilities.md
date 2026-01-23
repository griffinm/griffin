# Utilities

## Typesense Search Index

### Rebuild via API
```
GET /search/rebuild
```

Example:
```bash
curl http://localhost:3000/search/rebuild
```

### Rebuild via CLI
```bash
npm run refresh-typesense
```

Use the CLI version when making schema changes to the Typesense collections, as it deletes and recreates the collections with the updated schema.
