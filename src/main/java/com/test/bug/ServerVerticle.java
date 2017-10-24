package com.test.bug;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;

import java.net.HttpURLConnection;

/**
 *
 */
public class ServerVerticle extends AbstractVerticle {

  public void start() {
    HttpServerOptions options = new HttpServerOptions();
    HttpServer http = vertx.createHttpServer(options);

    SockJSHandler sockJS = SockJSHandler.create(vertx);
    BridgeOptions allAccessOptions = new BridgeOptions();
    allAccessOptions.addInboundPermitted(new PermittedOptions());
    allAccessOptions.addOutboundPermitted(new PermittedOptions());
    sockJS.bridge(allAccessOptions);

    Router router = Router.router(vertx);

    router.route("/eventbus/*").handler(sockJS);

    router.route("/*").handler(routingContext -> {
      System.out.println("request: " + routingContext.request().path());
      routingContext.next();
    });

    router.route("/js/*").handler(routingContext -> {
      routingContext.response().sendFile("webroot" + routingContext.request().path());
    });
    router.route("/views/*").handler(routingContext -> {
      routingContext.response().sendFile("webroot" + routingContext.request().path());
    });
    router.route("/").handler(routingContext -> {
      routingContext.response().sendFile("webroot/test.html");
    });
    router.routeWithRegex(".*").handler(routingContext -> {
      routingContext.response().setStatusCode(HttpURLConnection.HTTP_NOT_FOUND);
      System.out.println("Not found: " + routingContext.request().path());
      routingContext.response().end();
    });

    http.requestHandler(router::accept).listen(8484);
    System.out.println("Server is listening on port 8484");

    vertx.setPeriodic(3000, time -> {
      vertx.eventBus().publish("outbound.test", "Hello from server!");
    });

    vertx.eventBus().consumer("inbound.test", msg -> {
      System.out.println("Message received: " + msg.body());
      msg.reply("This is the reply from the server");
    });
  }
}
