const existingNotifStylesheet = document.querySelector('link[data-notification-stylesheet]');
if (!existingNotifStylesheet) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "/css/notification.css";
    style.dataset.notificationStylesheet = "true";
    document.head.appendChild(style);
}

class NotifPlacement {
    static TOP_LEFT = 0;
    static TOP_MIDDLE = 1;
    static TOP_RIGHT = 2;
    static RIGHT_TOP = 3;
    static RIGHT_MIDDLE = 4;
    static RIGHT_BOTTOM = 5;
    static BOTTOM_RIGHT = 6;
    static BOTTOM_MIDDLE = 7;
    static BOTTOM_LEFT = 8;
    static LEFT_TOP = 9;
    static LEFT_MIDDLE = 10;
    static LEFT_BOTTOM = 11;

    static isValid(type) {
        return [
            NotifPlacement.TOP_LEFT,
            NotifPlacement.TOP_MIDDLE,
            NotifPlacement.TOP_RIGHT,
            NotifPlacement.RIGHT_TOP,
            NotifPlacement.RIGHT_MIDDLE,
            NotifPlacement.RIGHT_BOTTOM,
            NotifPlacement.BOTTOM_RIGHT,
            NotifPlacement.BOTTOM_MIDDLE,
            NotifPlacement.BOTTOM_LEFT,
            NotifPlacement.LEFT_TOP,
            NotifPlacement.LEFT_MIDDLE,
            NotifPlacement.LEFT_BOTTOM
        ].includes(type);
    }
}

class NotifType {
    static INFO = "info";
    static SUCCESS = "success";
    static WARNING = "warning";
    static ERROR = "error";
    static isValid(type) {
        return [
            NotifType.INFO,
            NotifType.SUCCESS,
            NotifType.WARNING,
            NotifType.ERROR
        ].includes(type);
    }
}

const BOTTOM_ANCHOR_PLACEMENTS = new Set([
    NotifPlacement.RIGHT_BOTTOM,
    NotifPlacement.BOTTOM_RIGHT,
    NotifPlacement.BOTTOM_MIDDLE,
    NotifPlacement.BOTTOM_LEFT,
    NotifPlacement.LEFT_BOTTOM
]);

const DEFAULT_TIMEOUT_SECONDS = 5;

class Notification {
    static counter = 0;
    static containers = new Map();
    static root = null;

    static ensureRoot() {
        if (!Notification.root) {
            const root = document.createElement("div");
            root.classList.add("notification-layer");
            root.setAttribute("role", "presentation");
            const host = document.body || document.documentElement;
            host.appendChild(root);
            Notification.root = root;
        }

        return Notification.root;
    }

    static getContainer(placement) {
        Notification.ensureRoot();
        if (!Notification.containers.has(placement)) {
            const container = document.createElement("div");
            container.classList.add("notification-container");
            container.classList.add(`placement-${placement}`);
            container.dataset.placement = String(placement);
            Notification.root.appendChild(container);
            Notification.containers.set(placement, container);
        }

        return Notification.containers.get(placement);
    }

    static cleanupContainer(placement) {
        const container = Notification.containers.get(placement);
        if (container && container.childElementCount === 0) {
            container.remove();
            Notification.containers.delete(placement);
        }

        if (Notification.containers.size === 0 && Notification.root) {
            Notification.root.remove();
            Notification.root = null;
        }
    }

    static clearAll() {
        Notification.containers.forEach(container => {
            container.remove();
        });
        Notification.containers.clear();

        if (Notification.root) {
            Notification.root.remove();
            Notification.root = null;
        }

        Notification.counter = 0;
    }

    constructor(text, type = NotifType.INFO, timeout = DEFAULT_TIMEOUT_SECONDS, placement = NotifPlacement.BOTTOM_RIGHT) {
        this.placement = NotifPlacement.isValid(placement) ? placement : NotifPlacement.BOTTOM_RIGHT;
        this.type = NotifType.isValid(type) ? type : NotifType.INFO;
        this.text = typeof text === "string" ? text : String(text ?? "");

        const parsedTimeout = Number(timeout);
        const normalizedTimeout = Number.isFinite(parsedTimeout) ? Math.max(0, parsedTimeout) : DEFAULT_TIMEOUT_SECONDS;

        this.timeout = normalizedTimeout;
        this.autoDismiss = normalizedTimeout > 0;
        this.color = this.getColorForType(this.type);
    }

    getColorForType(type) {
        switch (type) {
            case NotifType.INFO:
                return "#2196F3";
            case NotifType.SUCCESS:
                return "#4CAF50";
            case NotifType.WARNING:
                return "#FFB300";
            case NotifType.ERROR:
                return "#F44336";
            default:
                return "#2196F3";
        }
    }

    show() {
        const notification = document.createElement("div");
        notification.classList.add("notification");
        notification.classList.add(`notif-${Notification.counter++}`);
        notification.classList.add(`placement-${this.placement}`);
        notification.dataset.type = this.type;
        notification.style.setProperty("--background-color-dynamic", `${this.color}`);
        notification.setAttribute("role", "status");
        notification.setAttribute("aria-live", this.type === NotifType.ERROR ? "assertive" : "polite");

        if (this.autoDismiss) {
            notification.style.setProperty("--delay", `${this.timeout}s`);
        } else {
            notification.classList.add("no-timeout");
        }

        const container = Notification.getContainer(this.placement);
        const placement = this.placement;

        const col = document.createElement("div");
        col.classList.add("col");

        const row = document.createElement("div");
        row.classList.add("row");

        const closeBtn = document.createElement("button");
        closeBtn.classList.add("close-btn");
        closeBtn.type = "button";
        closeBtn.setAttribute("aria-label", "Sluit melding");
        closeBtn.innerHTML = "<span aria-hidden=\"true\">&times;</span>";

        const textContainer = document.createElement("div");
        textContainer.classList.add("text-container");
        textContainer.textContent = this.text;

        row.appendChild(textContainer);
        row.appendChild(closeBtn);

        const timeout = document.createElement("div");
        timeout.classList.add("timeout");
        timeout.hidden = !this.autoDismiss;

        col.appendChild(row);
        col.appendChild(timeout);

        notification.appendChild(col);
        const shouldAppend = BOTTOM_ANCHOR_PLACEMENTS.has(placement);

        if (shouldAppend) {
            container.appendChild(notification);
        } else {
            container.insertBefore(notification, container.firstChild || null);
        }

        let isClosing = false;
        let dismissTimerId = null;
        let dismissStart = 0;
        let remainingTime = this.autoDismiss ? this.timeout * 1000 : 0;

        const clearTimer = () => {
            if (dismissTimerId !== null) {
                window.clearTimeout(dismissTimerId);
                dismissTimerId = null;
            }
        };

        const finalizeRemoval = () => {
            if (!notification.isConnected) {
                return;
            }
            notification.remove();
            Notification.cleanupContainer(placement);
        };

        const removeNotification = () => {
            if (isClosing) {
                return;
            }
            isClosing = true;
            clearTimer();
            notification.classList.remove("display");

            const handleTransitionEnd = (event) => {
                if (event.target !== notification) {
                    return;
                }
                notification.removeEventListener("transitionend", handleTransitionEnd);
                finalizeRemoval();
            };

            notification.addEventListener("transitionend", handleTransitionEnd);

            window.setTimeout(() => {
                notification.removeEventListener("transitionend", handleTransitionEnd);
                finalizeRemoval();
            }, 400);
        };

        const scheduleTimer = () => {
            if (!this.autoDismiss || isClosing) {
                return;
            }

            if (remainingTime <= 0) {
                removeNotification();
                return;
            }

            dismissStart = performance.now();
            dismissTimerId = window.setTimeout(() => {
                removeNotification();
            }, remainingTime);
        };

        const pauseTimer = () => {
            if (!this.autoDismiss || dismissTimerId === null) {
                return;
            }
            clearTimer();
            const elapsed = performance.now() - dismissStart;
            remainingTime = Math.max(0, remainingTime - elapsed);
        };

        const resumeTimer = () => {
            if (!this.autoDismiss || isClosing) {
                return;
            }

            if (remainingTime <= 0) {
                removeNotification();
                return;
            }

            scheduleTimer();
        };

        closeBtn.addEventListener("click", () => {
            removeNotification();
        });

        notification.addEventListener("mouseenter", () => {
            pauseTimer();
        });

        notification.addEventListener("mouseleave", () => {
            resumeTimer();
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                notification.classList.add("display");
            });
        });

        if (this.autoDismiss) {
            scheduleTimer();
        }
    }
}

export {
    Notification,
    NotifPlacement,
    NotifType
}

window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        Notification.clearAll();
    }
});
