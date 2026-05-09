export type UserResult<T> =
  | {
      ok: true;
      value: T;
      message: string;
      detail?: string;
    }
  | {
      ok: false;
      message: string;
      detail?: string;
    };
