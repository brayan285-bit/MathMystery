import { User, UserRole } from '../types';

// Mock database keys
const USERS_KEY = 'math_mystery_users';
const CURRENT_USER_KEY = 'math_mystery_current_user';

// Initial Admin
const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  name: 'Super Admin',
  email: 'admin@mathmystery.com',
  username: 'Admin',
  role: UserRole.ADMIN,
  password: 'Admin' 
};

export const MockFirebase = {
  // --- Auth ---
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  login: (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Hardcoded Admin Check
        if (username === 'Admin' && password === 'Admin') {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEFAULT_ADMIN));
            resolve(DEFAULT_ADMIN);
            return;
        }

        const users = MockFirebase.getAllUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Credenciales inválidas'));
        }
      }, 500);
    });
  },

  register: (newUser: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = MockFirebase.getAllUsers();
        if (users.some(u => u.username === newUser.username || u.email === newUser.email)) {
          reject(new Error('El usuario o correo ya existe'));
          return;
        }

        const user: User = {
          ...newUser,
          id: `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          lives: 5,
          score: 0,
          level: 1
        };

        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        resolve(user);
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // --- Data Management ---
  getAllUsers: (): User[] => {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  updateUser: (updatedUser: User): Promise<void> => {
    return new Promise((resolve) => {
      const users = MockFirebase.getAllUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // Update current user if it matches
        const currentUser = MockFirebase.getCurrentUser();
        if (currentUser && currentUser.id === updatedUser.id) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        }
      }
      resolve();
    });
  },

  deleteUser: (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      const users = MockFirebase.getAllUsers();
      const newUsers = users.filter(u => u.id !== userId);
      localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      resolve();
    });
  },

  saveGameProgress: (userId: string, score: number, level: number, lives: number) => {
    const users = MockFirebase.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        // Ensure we are updating the existing user record properly
        const updatedUser = {
            ...users[index],
            score: score,
            level: level,
            lives: lives
        };
        
        users[index] = updatedUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // Update active session if it matches
        const currentUser = MockFirebase.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedCurrentUser = { ...currentUser, score, level, lives };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
        }
    }
  }
};