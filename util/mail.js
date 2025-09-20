import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: process.env.TLS_REJECT_UNAUTH === "true"
    }
});

async function sendMail(receiver, subject, content) {
    try {
        await transporter.sendMail({
            from: '"Activiteiten" <activiteiten@activadis.shrt.now>',
            to: receiver,
            subject: subject,
            html: content
        });
    } catch (err) {
        console.error(err);
    }
}

export default sendMail;