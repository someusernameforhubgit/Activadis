const style = document.createElement("link");
style.rel = "stylesheet";
style.href = "/css/notification.css";

document.head.appendChild(style);

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

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
    }
});

class Notification {
    static counter = 0;

    constructor(text, type = NotifType.INFO, timeout = 5, placement = NotifPlacement.BOTTOM_RIGHT) {
        this.placement = NotifPlacement.isValid(placement) ? placement : 6;
        this.text = text;
        this.timeout = timeout;
        this.color = this.getColorForType(type);
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
                return "#2196F3"; // Default color if type is not recognized
        }
    }

    show() {
        const notification = document.createElement("div");
        notification.classList.add("notification");
        notification.classList.add(`notif-${Notification.counter++}`);
        notification.classList.add(`placement-${this.placement}`);
        notification.style.setProperty("--background-color-dynamic", `${this.color}`);
        notification.style.setProperty("--delay", `${this.timeout}s`);

        const col = document.createElement("div");
        col.classList.add("col");

        const row = document.createElement("div");
        row.classList.add("row");

        const closeBtn = document.createElement("button");
        closeBtn.classList.add("close-btn");
        closeBtn.innerHTML = "<i class='fas fa-times'></i>";
        closeBtn.addEventListener("click", () => {
            notification.classList.remove("display");
            setTimeout(() => {
                notification.remove();
            }, 300);
        });

        const textContainer = document.createElement("div");
        textContainer.classList.add("text-container");
        textContainer.innerText = this.text;

        row.appendChild(textContainer);
        row.appendChild(closeBtn);

        const timeout = document.createElement("div");
        timeout.classList.add("timeout");

        col.appendChild(row);
        col.appendChild(timeout);

        notification.appendChild(col);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add("display");
        }, 100);

        setTimeout(() => {
            if (notification) {
                notification.classList.remove("display");
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, this.timeout * 1000);
    }
}

export {
    Notification,
    NotifPlacement,
    NotifType
}