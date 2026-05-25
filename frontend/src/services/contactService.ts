import api, { unwrapApiData } from './api';

export type ContactPayload = {
  name: string;
  phone: string;
  email?: string;
  need?: string;
  message?: string;
};

export const contactService = {
  async createContact(payload: ContactPayload) {
    const { data } = await api.post('/contact', payload);
    return unwrapApiData(data);
  },
};
