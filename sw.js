self.addEventListener("push", event => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.error("Invalid push payload:", error);
    }

    const title = data.title || "FH EMPIRE";

    const options = {
        body: data.body || "You have a new notification.",
        icon: "images/logo.png",
        badge: "images/logo.png",

        tag: data.orderId
            ? `fh-order-${data.orderId}`
            : (data.tag || "fh-general"),

        renotify: false,

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