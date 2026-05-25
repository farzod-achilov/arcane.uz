import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    isAdmin?:  boolean;
    arcCoins?: number;
    xp?:       number;
    level?:    number;
  }

  interface Session {
    user: {
      id:       string;
      name?:    string | null;
      email?:   string | null;
      image?:   string | null;
      isAdmin:  boolean;
      arcCoins: number;
      xp:       number;
      level:    number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:        string;
    isAdmin?:  boolean;
    arcCoins?: number;
    xp?:       number;
    level?:    number;
  }
}
