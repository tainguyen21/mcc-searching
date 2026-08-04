export * from './auth.schema';
export * from './enums';
export * from './merchant.schema';
export * from './relations';
export * from './source.schema';

import * as authSchema from './auth.schema';
import * as merchantSchema from './merchant.schema';
import * as sourceSchema from './source.schema';

export const schema = {
  ...authSchema,
  ...merchantSchema,
  ...sourceSchema,
};
