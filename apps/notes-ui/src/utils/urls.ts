export const urls = {
  home: '/',
  note: (noteId: string) => `/notes/${noteId}`,
  signIn: '/sign-in',
  signUp: '/sign-up',
  task: (taskId: string) => `/tasks/${taskId}`,
};
