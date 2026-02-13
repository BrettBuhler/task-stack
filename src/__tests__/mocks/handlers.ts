import { http, HttpResponse } from 'msw';

export const handlers = [
  // Resend email API mock
  http.post('https://api.resend.com/emails', () => {
    return HttpResponse.json({ id: 'email-123' });
  }),
];
