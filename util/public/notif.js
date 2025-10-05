class NotifPlacement {
    static TOP_LEFT = 0;
    static TOP_MIDDLE = 1;
    static TOP_RIGHT = 2;
    static RIGHT_MIDDLE = 3;
    static BOTTOM_RIGHT = 4;
    static BOTTOM_MIDDLE = 5;
    static BOTTOM_LEFT = 6;
    static LEFT_MIDDLE = 7;

    static isValid(type) {
        return [
            NotifPlacement.TOP_LEFT,
            NotifPlacement.TOP_MIDDLE,
            NotifPlacement.TOP_RIGHT,
            NotifPlacement.RIGHT_MIDDLE,
            NotifPlacement.BOTTOM_RIGHT,
            NotifPlacement.BOTTOM_MIDDLE,
            NotifPlacement.BOTTOM_LEFT,
            NotifPlacement.LEFT_MIDDLE
        ].includes(type);
    }
}

class Notification {
    constructor(placement, text, timeout = 5, color = "lime") {
        this.placement = NotifPlacement.isValid(placement) ? placement : 0;
        this.text = text;
        this.color = color;
        this.timeout = timeout;
    }

    show() {
        const notification = document.createElement("div");
        notification.classList.add("notification");
        notification.style.setProperty("--duration", `${this.timeout}s`);
        notification.textContent = this.text;
        document.body.appendChild(notification);
    }
}

export {
    Notification,
    NotifPlacement
}