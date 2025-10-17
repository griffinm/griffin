# Task Status Migration

This document explains how to migrate existing tasks to the new structure with `status` and status history while preserving the existing `completedAt` field.

## Overview

The migration script (`migrate-task-status.ts`) will:

1. **Migrate completed tasks**: Set status to `COMPLETED` and create history entries
2. **Migrate incomplete tasks**: Set status to `TODO` and create initial history
3. **Create status history**: Track when each task changed status with timestamps
4. **Preserve existing data**: Keep the `completedAt` column for backward compatibility

## Prerequisites

1. **Database migration**: Run the Prisma migration first to update the schema:

   ```bash
   npx prisma migrate dev --name add-task-status-and-history
   ```

2. **Environment setup**: Ensure your `.env.local` file is configured with the correct database connection.

## Running the Migration

### Step 1: Run the Prisma Migration

```bash
cd apps/api
npx prisma migrate dev --name add-task-status-and-history
```

### Step 2: Run the Data Migration Script

```bash
# From the project root
npx tsx apps/api/src/scripts/migrate-task-status.ts
```

### Step 3: Verify the Migration

Check that tasks have been migrated correctly:

```bash
# Connect to your database and run:
SELECT id, title, status FROM tasks LIMIT 10;
SELECT task_id, status, changed_at FROM task_status_history ORDER BY changed_at LIMIT 10;
```

### Step 4: Verify the Migration

The migration preserves the `completedAt` column for backward compatibility, so no cleanup is needed.

## What the Migration Does

### For Completed Tasks:

- Sets `status` to `COMPLETED`
- Creates two history entries:
  - `TODO` status at the task's creation time
  - `COMPLETED` status at the original `completedAt` time

### For Incomplete Tasks:

- Sets `status` to `TODO`
- Creates one history entry:
  - `TODO` status at the task's creation time

## Safety Features

- **Idempotent**: Can be run multiple times safely
- **Error handling**: Continues processing even if individual tasks fail
- **Logging**: Detailed console output for monitoring progress
- **Backward compatible**: Preserves the `completedAt` column for existing functionality
- **Rollback safe**: Doesn't modify existing data, only adds new fields and history

## Troubleshooting

### If the script fails:

1. Check your database connection in `.env.local`
2. Ensure the Prisma migration has been applied
3. Verify you have the necessary database permissions
4. Check the console output for specific error messages

### If you need to rollback:

1. The `completed_at` column is preserved, so existing functionality remains intact
2. You can restore from a database backup if needed
3. The new `status` and `statusHistory` fields can be dropped if necessary

## Environment Variables

- `LOG_LEVEL`: Controls console output verbosity (default: 'log')

## Example Output

```
Starting task status migration...
Found 15 completed tasks to migrate
Found 42 incomplete tasks to migrate
Migrated completed task a1b2c3d...
Migrated incomplete task e4f5g6h...
Successfully migrated 57 tasks
Task status migration completed!
Note: completed_at column is preserved for backward compatibility.
```
