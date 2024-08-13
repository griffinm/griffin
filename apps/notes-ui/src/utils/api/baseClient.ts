import axios from 'axios';

const isLocal = window.location.hostname === 'localhost';
const baseURL = isLocal ? 'http://localhost:3000/api' : 'https://api.notes.com/api';

export const baseClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
