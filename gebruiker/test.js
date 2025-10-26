import {
    Notification,
    NotifPlacement,
    NotifType
} from "../util/notif.js";

const placements = [
    { type: NotifPlacement.TOP_LEFT, name: "TOP_LEFT" },
    { type: NotifPlacement.TOP_MIDDLE, name: "TOP_MIDDLE" },
    { type: NotifPlacement.TOP_RIGHT, name: "TOP_RIGHT" },
    { type: NotifPlacement.RIGHT_TOP, name: "RIGHT_TOP" },
    { type: NotifPlacement.RIGHT_MIDDLE, name: "RIGHT_MIDDLE" },
    { type: NotifPlacement.RIGHT_BOTTOM, name: "RIGHT_BOTTOM" },
    { type: NotifPlacement.BOTTOM_RIGHT, name: "BOTTOM_RIGHT" },
    { type: NotifPlacement.BOTTOM_MIDDLE, name: "BOTTOM_MIDDLE" },
    { type: NotifPlacement.BOTTOM_LEFT, name: "BOTTOM_LEFT" },
    { type: NotifPlacement.LEFT_BOTTOM, name: "LEFT_BOTTOM" },
    { type: NotifPlacement.LEFT_MIDDLE, name: "LEFT_MIDDLE" },
    { type: NotifPlacement.LEFT_TOP, name: "LEFT_TOP" }
];

window.testNotifications = () => {
    placements.forEach((placement, index) => {
        setTimeout(() => {
            const notification = new Notification(
                `Notification: ${placement.name}`,
                getRandomColor(),
                5,
                placement.type
            );
            notification.show();
        }, index * 750);
    });
}

function getRandomColor() {
    const types = [
        NotifType.INFO,
        NotifType.SUCCESS,
        NotifType.WARNING,
        NotifType.ERROR
    ];
    return types[Math.floor(Math.random() * types.length)];
}

window.testNotificationStacking = () => {
    placements.forEach((side, i) => {
        setTimeout(() => {
            const types = Object.values(NotifType);
            
            types.forEach((type, j) => {
                setTimeout(() => {
                    const notification = new Notification(side.name, type, 2, side.type);
                    notification.show();
                }, j * 300);
            });
        }, i * 1200);
    });
};


// window.testNotificationStacking();