export type ApiOk<T> = { data: T };

export type ApiErr = {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
};

export type OffsetPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ServerTimed<T> = T & { serverTime: string };
