export type ListQuery = {
  // A limit on the number of objects to be returned. The default is 10.
  limit?: number;
  // A cursor for use in pagination. after is an object ID that defines your place in the list.
  // For instance, if you make a list request and receive 100 objects, ending with obj_foo,
  // your subsequent call can include after=obj_foo in order to fetch the next page of the list.
  after?: string;
  // A cursor for use in pagination. before is an object ID that defines your place in the list or 'latest'.
  // For instance, if you make a list request and receive 100 objects, ending with obj_foo,
  // your subsequent call can include before=obj_foo in order to fetch the previous page of the list.
  before?: string;
};

export type ListResult<T> = {
  list: T[];
};

export function listQueryString(q: ListQuery) {
  return `limit=${q.limit ?? 10}&after=${q.after ?? ""}&before=${q.before ?? ""}`;
}

export function displayListQuery(q: ListQuery) {
  return `limit: ${q.limit ?? 10}${q.after ? ` after: ${q.after}` : ""}${q.before ? ` before: ${q.before}` : ""}`;
}
