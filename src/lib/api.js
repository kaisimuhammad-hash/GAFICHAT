async function parse(res, { authPath = false } = {}) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error || `Permintaan gagal (${res.status})`);
    error.status = res.status;
    if (res.status === 401 && !authPath) {
      window.dispatchEvent(new Event('nexadesk:unauthorized'));
    }
    throw error;
  }
  return data;
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parse(res, { authPath: path.startsWith('/auth/') });
}

// File gambar dikirim apa adanya sebagai body mentah supaya tidak perlu dikoding base64.
async function upload(path, file, mimetype) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': mimetype },
    body: file,
  });
  return parse(res);
}

const id = (value) => encodeURIComponent(value);

export const api = {
  authStatus: () => request('/auth/status'),
  setupAdmin: (payload) => request('/auth/setup', { method: 'POST', body: payload }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  signOut: () => request('/auth/logout', { method: 'POST', body: {} }),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/password', { method: 'POST', body: { currentPassword, newPassword } }),
  users: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: payload }),
  updateUser: (userId, patch) => request(`/users/${id(userId)}`, { method: 'PATCH', body: patch }),
  resetUserPassword: (userId, password) =>
    request(`/users/${id(userId)}/password`, { method: 'POST', body: { password } }),
  state: () => request('/state'),
  messages: (chatId, { before, limit } = {}) => {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    if (limit) params.set('limit', String(limit));
    const query = params.toString();
    return request(`/chats/${id(chatId)}/messages${query ? `?${query}` : ''}`);
  },
  send: (chatId, text, replyTo) =>
    request(`/chats/${id(chatId)}/send`, {
      method: 'POST',
      body: replyTo ? { text, replyTo } : { text },
    }),
  startChat: ({ accountId, phone, text = '', name = '' }) =>
    request('/chats/start', { method: 'POST', body: { accountId, phone, text, name } }),
  sendImage: (chatId, file, { caption = '', replyTo } = {}) => {
    const params = new URLSearchParams();
    if (caption) params.set('caption', caption);
    if (replyTo) params.set('replyTo', replyTo);
    const query = params.toString();
    return upload(
      `/chats/${id(chatId)}/media${query ? `?${query}` : ''}`,
      file,
      file.type || 'image/jpeg',
    );
  },
  chatMode: (chatId, mode) =>
    request(`/chats/${id(chatId)}/mode`, { method: 'POST', body: { mode } }),
  read: (chatId) => request(`/chats/${id(chatId)}/read`, { method: 'POST', body: {} }),
  deleteChat: (chatId, remote = false) =>
    request(`/chats/${id(chatId)}`, { method: 'DELETE', body: { remote } }),
  hideMessage: (messageId) => request(`/messages/${id(messageId)}`, { method: 'DELETE' }),
  editMessage: (messageId, text) =>
    request(`/messages/${id(messageId)}`, { method: 'PATCH', body: { text } }),
  revokeMessage: (messageId) =>
    request(`/messages/${id(messageId)}/revoke`, { method: 'POST', body: {} }),
  connect: (accountId) => request(`/accounts/${id(accountId)}/connect`, { method: 'POST', body: {} }),
  logout: (accountId) => request(`/accounts/${id(accountId)}/logout`, { method: 'POST', body: {} }),
  updateAccount: (accountId, patch) =>
    request(`/accounts/${id(accountId)}`, { method: 'PATCH', body: patch }),
  createTicket: (ticket) => request('/tickets', { method: 'POST', body: ticket }),
  updateTicket: (ticketId, patch) =>
    request(`/tickets/${id(ticketId)}`, { method: 'PATCH', body: patch }),
  deleteTicket: (ticketId) => request(`/tickets/${id(ticketId)}`, { method: 'DELETE' }),
  updateSettings: (patch) => request('/settings', { method: 'PATCH', body: patch }),
  testGemini: () => request('/settings/test', { method: 'POST', body: {} }),
};
