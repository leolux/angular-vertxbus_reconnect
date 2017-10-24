# angular-vertxbus_reconnect
vertxEventBusService stops working when the disconnection takes at least 6 seconds before reconnect.

1. Start MainVertx (the server sends a message every 3 seconds)
2. Open http://localhost:8484/ in the browser
3. Wait for the "connected" string to appear in the browser
4. Stop the server for at least 6 seconds
5. Start the server again
6. Wait for the "connected" string to appear in the browser //the reconnect
7. Now vertxEventBusService does not work anymore
