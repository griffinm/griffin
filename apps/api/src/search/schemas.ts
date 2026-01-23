import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

export const noteSchema: CollectionCreateSchema = {
  name: "notes",
  fields: [
    {
      name: "id",
      type: "string",
    },
    {
      name: "title",
      type: "string",
    },
    {
      name: "content",
      type: "string",
    },
    {
      name: 'userId',
      type: 'string',
    },
    {
      name: 'notebookId',
      type: 'string',
    }
  ],
};

export const taskSchema: CollectionCreateSchema = {
  name: "tasks",
  fields: [
    {
      name: "id",
      type: "string",
    },
    {
      name: "title",
      type: "string",
    },
    {
      name: "description",
      type: "string",
    },
    {
      name: 'userId',
      type: 'string',
    },
    {
      name: 'dueDate',
      type: 'int64',
      optional: true,
    },
    {
      name: 'status',
      type: 'string',
    },
    {
      name: 'priority',
      type: 'string',
    }
  ],
};

export const tagSchema: CollectionCreateSchema = {
  name: "tags",
  fields: [
    {
      name: "id",
      type: "string",
    },
    {
      name: "name",
      type: "string",
    },
    {
      name: 'userId',
      type: 'string',
    }
  ],
};

export const questionSchema: CollectionCreateSchema = {
  name: "questions",
  fields: [
    {
      name: "id",
      type: "string",
    },
    {
      name: "question",
      type: "string",
    },
    {
      name: "answer",
      type: "string",
      optional: true,
    },
    {
      name: "userId",
      type: "string",
    },
    {
      name: "noteId",
      type: "string",
    },
  ],
};
