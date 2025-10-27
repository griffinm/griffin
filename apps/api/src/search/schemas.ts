export const noteSchema = {
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
    }
  ],
};

export const taskSchema = {
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
      type: 'datetime',
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
