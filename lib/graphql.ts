import { API_URL } from "@/lib/api";

export type GraphQLError = {
  message: string;
  path?: (string | number)[];
};

export class GraphQLRequestError extends Error {
  errors: GraphQLError[];
  constructor(errors: GraphQLError[]) {
    super(errors.map((e) => e.message).join("; "));
    this.name = "GraphQLRequestError";
    this.errors = errors;
  }
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const body: { data: T | null; errors?: GraphQLError[] } = await res.json();
  // an error in the query or in a resolver arrives with status 200:
  // without this check the page would treat data: null as a success
  if (body.errors?.length) throw new GraphQLRequestError(body.errors);
  return body.data as T;
}
