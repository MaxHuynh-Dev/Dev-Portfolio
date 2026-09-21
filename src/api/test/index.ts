import HTTP_REQUEST, { type TDefaultResponse } from '@Api/index';

export const getPosts = async (): Promise<TDefaultResponse<unknown>> => {
  return await HTTP_REQUEST.get<unknown>('/posts');
};
