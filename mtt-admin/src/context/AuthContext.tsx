import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id?: number | string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  initials: string;
}

interface AuthContextType {
  user: AuthUser;
  greeting: string;
  setUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
}

const DEFAULT_USER: AuthUser = {
  name: 'Daniel Aroko',
  email: 'daniel.a@mapletynetechnologies.com',
  role: 'Super Admin',
  initials: 'DA',
};

const getInitials = (name: string, email?: string): string => {
  if (!name || name.trim().length === 0) {
    if (email && email.length >= 2) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return parts[0].toUpperCase();
};

const formatRole = (role?: string, roles?: string[]): string => {
  const r = (role || (roles && roles[0]) || '').toLowerCase();
  if (r.includes('super') || r.includes('cpo-admin') || r === 'superadmin' || r === 'admin') {
    return 'Super Admin';
  }
  if (r.includes('operator')) {
    return 'Site Operator';
  }
  if (r.includes('fleet')) {
    return 'Fleet Manager';
  }
  if (r.includes('driver')) {
    return 'EV Driver';
  }
  return 'Admin';
};

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Good day';
  }
};

const parseJwtPayload = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const loadInitialUser = (): AuthUser => {
  try {
    const storedUserStr = localStorage.getItem('opencpo_user');
    if (storedUserStr) {
      const parsed = JSON.parse(storedUserStr);
      const name = parsed.name || (parsed.email ? parsed.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Daniel Aroko');
      const email = parsed.email || 'daniel.a@mapletynetechnologies.com';
      const role = formatRole(parsed.role, parsed.roles);
      return {
        ...parsed,
        name,
        email,
        role,
        initials: getInitials(name, email),
      };
    }

    const token = localStorage.getItem('opencpo_admin_jwt');
    if (token) {
      const claims = parseJwtPayload(token);
      if (claims) {
        const email = claims.email || claims.preferred_username || 'daniel.a@mapletynetechnologies.com';
        const name = claims.name || (email ? email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Daniel Aroko');
        const role = formatRole(claims.role, claims.roles);
        return {
          id: claims.sub,
          name,
          email,
          role,
          initials: getInitials(name, email),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load stored user context', err);
  }
  return DEFAULT_USER;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser>(loadInitialUser);
  const [greeting, setGreeting] = useState<string>(getTimeGreeting);

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeGreeting());
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const setUser = (updated: Partial<AuthUser>) => {
    setUserState((prev) => {
      const next = { ...prev, ...updated };
      next.role = formatRole(next.role, next.roles);
      next.initials = getInitials(next.name, next.email);
      localStorage.setItem('opencpo_user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('opencpo_admin_jwt');
    localStorage.removeItem('opencpo_refresh_token');
    localStorage.removeItem('opencpo_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, greeting, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
