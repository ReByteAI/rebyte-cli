export type ListQuery = {
  // A limit on the number of objects to be returned.
  // Defaults to 20
  limit?: number
  // Sort order by the timestamp of the objects. asc for ascending order and desc for descending order.
  // Defaults to desc
  order?: "asc" | "desc"
  // A cursor for use in pagination. after is an object ID that defines your place in the list.
  // For instance, if you make a list request and receive 100 objects, ending with obj_foo,
  // your subsequent call can include after=obj_foo in order to fetch the next page of the list.
  after?: string
  // A cursor for use in pagination. before is an object ID that defines your place in the list.
  // For instance, if you make a list request and receive 100 objects, ending with obj_foo,
  // your subsequent call can include before=obj_foo in order to fetch the previous page of the list.
  before?: string
}
export type ListResult<T> = {
  list: T[]
}
export function listQueryString(q: ListQuery) {
  return `limit=${q.limit ?? 20}&order=${q.order ?? "desc"}&after=${
    q.after ?? ""
  }&before=${q.before ?? ""}`
}

export function displayListQuery(q: ListQuery) {
  return `limit: ${q.limit ?? 20} order: ${q.order ?? "desc"}${q.after ? ` after: ${q.after}` : ""}${q.before ? ` before: ${q.before}` : ""}`;
}
