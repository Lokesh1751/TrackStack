import 'express-session';

declare module 'express' {
  interface Request {
    session: {
      userId?: string;
      destroy: (callback: (err: Error) => void) => void;
    };
  }
}
