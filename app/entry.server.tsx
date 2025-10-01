import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from "@/server";
import { routeAgentRequest } from "agents";

const createContext = (ctx: AppLoadContext, headers: Headers) => {
  return {
    headers: headers,
    env: ctx.cloudflare.env,
    db: ctx.db,
    auth: ctx.auth,
  }
}
export type TRPCContext = ReturnType<typeof createContext>;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const url = new URL(request.url);
  console.log("url.pathname", url.pathname);
  if (url.pathname.startsWith("/agents")) {
    console.log("agents");
    // Let the agents SDK handle agent routes
    return (await routeAgentRequest(request, _loadContext.cloudflare.env)) || Response.json({ msg: 'no agent here' }, { status: 404 });
  }
  if (url.pathname.startsWith("/api")) {
    if (url.pathname.startsWith("/api/trpc")) {
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: () => {
          return createContext(_loadContext, request.headers)
        }
      });
    }
    if (url.pathname.startsWith("/api/auth")) {
      return _loadContext.auth.handler(request);
    }
  }

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
