// Local auth system using localStorage
// Admin is hardcoded, passengers are stored in localStorage

const USERS_KEY = 'limbus_users';
const SESSION_KEY = 'limbus_session';

const ADMIN_USER = {
  id: 'admin',
  username: 'admin',
  password: '1234',
  role: 'admin',
  full_name: 'Administrator',
  email: 'admin@limbus.co.za',
};

const getStoredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const localAuth = {
  login: (username, password) => {
    // Check admin
    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
      const session = { ...ADMIN_USER };
      delete session.password;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session };
    }

    // Check registered passengers
    const users = getStoredUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const session = { ...user };
      delete session.password;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session };
    }

    return { success: false, error: 'Invalid username or password' };
  },

  register: (username, password, fullName) => {
    if (username === 'admin') {
      return { success: false, error: 'This username is not allowed' };
    }

    const users = getStoredUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Username already taken' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username,
      password,
      full_name: fullName,
      email: username + '@passenger.limbus',
      role: 'passenger',
    };

    users.push(newUser);
    saveUsers(users);

    const session = { ...newUser };
    delete session.password;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  },

  getSession: () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },
};
