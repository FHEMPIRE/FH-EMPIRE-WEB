self.addEventListener("push", event => {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "FH EMPIRE";
    const options = {
        body: data.body || "You have a new notification.",
        icon: "images/logo.png",
        badge: "images/logo.png",
        data: {
            url: data.url || "admin.html"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", event => {
    event.notification.close();

    const url = event.notification.data?.url || "admin.html";

    event.waitUntil(
        clients.openWindow(url)
    );
});