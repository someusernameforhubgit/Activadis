import nodemailer from "nodemailer";

// Email template with responsive design and inline styles for maximum compatibility
const emailTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Activadis</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        body {
            font-family: 'Roboto', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #2c3e50;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .email-logo {
            max-width: 180px;
            height: auto;
        }
        .email-content {
            padding: 30px;
        }
        .email-footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            margin: 15px 0;
            background-color: #f8f9fa;
            color: #212529 !important;
            text-decoration: none;
            border: 2px solid #6c757d;
            border-radius: 4px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            -webkit-text-size-adjust: none;
            mso-hide: all;
        }
        .button:hover {
            background-color: #e9ecef;
            border-color: #495057;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0;
            }
            .email-content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Activadis</h1>
        </div>
        <div class="email-content">
            ${content}
        </div>
        <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} Activadis. Alle rechten voorbehouden.</p>
            <p>Deze e-mail is automatisch verzonden, reageer hier niet op.</p>
        </div>
    </div>
</body>
</html>
`;

// Email templates
const templates = {
    // 1. Activity deleted by admin
    activityDeleted: (activityName) => ({
        subject: 'Activiteit geannuleerd',
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Activiteit geannuleerd: ${activityName}</h2>
            <p>Helaas is de activiteit waar u voor had ingeschreven geannuleerd door een beheerder.</p>
            <p>We hopen u bij een andere gelegenheid te mogen verwelkomen.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 2. Password reset requested
    passwordResetRequested: (resetLink) => ({
        subject: 'Wachtwoord opnieuw instellen',
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Wachtwoord opnieuw instellen</h2>
            <p>Er is een verzoek ontvangen om het wachtwoord voor uw Activadis account opnieuw in te stellen.</p>
            <p>Klik op onderstaande knop om een nieuw wachtwoord in te stellen: <a href="${resetLink}" class="button" style="color: #000000;">Wachtwoord instellen</a></p>
            <p>Als u dit verzoek niet heeft gedaan, kunt u deze e-mail veilig negeren.</p>
            <p>Deze link is 15 minuten geldig.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 3. Account created by admin
    accountCreated: (resetLink) => ({
        subject: 'Uw Activadis account is aangemaakt',
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Welkom bij Activadis!</h2>
            <p>Er is een account voor u aangemaakt door een beheerder. U kunt nu inloggen en gebruik maken van alle functionaliteiten.</p>
            <p>Klik op onderstaande knop om uw wachtwoord in te stellen en in te loggen: <a href="${resetLink}" class="button" style="color: #000000;">Wachtwoord instellen</a></p>
            <p>Deze link is 15 minuten geldig.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 4. Password reset by admin
    passwordResetByAdmin: (resetLink) => ({
        subject: 'Uw wachtwoord is gereset',
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Wachtwoord gereset door beheerder</h2>
            <p>Uw wachtwoord is opnieuw ingesteld door een beheerder.</p>
            <p>Klik op onderstaande knop om een nieuw wachtwoord in te stellen: <a href="${resetLink}" class="button" style="color: #000000;">Nieuw wachtwoord instellen</a></p>
            <p>Deze link is 15 minuten geldig.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 5. Signed up for an activity
    activitySignedUp: (activityName, activityLink) => ({
        subject: `Inschrijving bevestigd: ${activityName}`,
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Inschrijving bevestigd</h2>
            <p>U bent succesvol ingeschreven voor de activiteit: <strong>${activityName}</strong>.</p>
            <p>Bekijk de activiteitspagina voor meer informatie: <a href="${activityLink}" class="button" style="color: #000000;">Bekijk activiteit</a></p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 6. Already signed up for an activity
    alreadySignedUp: (activityName) => ({
        subject: `U bent al ingeschreven voor ${activityName}`,
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Al ingeschreven</h2>
            <p>U bent al ingeschreven voor de activiteit: <strong>${activityName}</strong>.</p>
            <p>Er is geen verdere actie vereist.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 7. Confirm sign up for activity
    confirmSignUp: (activityName, confirmationLink) => ({
        subject: `Bevestig uw inschrijving voor ${activityName}`,
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Bevestig uw inschrijving</h2>
            <p>U heeft een verzoek gedaan om in te schrijven voor de activiteit: <strong>${activityName}</strong>.</p>
            <p>Klik op onderstaande knop om uw inschrijving te bevestigen: <a href="${confirmationLink}" class="button" style="color: #000000;">Inschrijving bevestigen</a></p>
            <p>Als u zich niet heeft ingeschreven voor deze activiteit, kunt u deze e-mail negeren.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 8. Signed out from activity
    activitySignedOut: (activityName) => ({
        subject: `Uitgeschreven voor ${activityName}`,
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Uitgeschreven</h2>
            <p>U bent succesvol uitgeschreven voor de activiteit: <strong>${activityName}</strong>.</p>
            <p>We hopen u bij een volgende gelegenheid weer te mogen verwelkomen.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 9. Already signed out from activity
    alreadySignedOut: (activityName) => ({
        subject: `Niet ingeschreven voor ${activityName}`,
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Niet ingeschreven</h2>
            <p>U bent niet ingeschreven voor de activiteit: <strong>${activityName}</strong>.</p>
            <p>Er is geen actie vereist.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    }),
    
    // 10. Confirm sign out from activity
    confirmSignOut: (activityName, confirmationLink) => ({
        subject: `Bevestig uitschrijving voor ${activityName}`,
        content: `
            <h2 style="color: #2c3e50; margin-top: 0;">Bevestig uw uitschrijving</h2>
            <p>U heeft een verzoek gedaan om uit te schrijven voor de activiteit: <strong>${activityName}</strong>.</p>
            <p>Klik op onderstaande knop om uw uitschrijving te bevestigen: <a href="${confirmationLink}" class="button" style="color: #000000;">Uitschrijving bevestigen</a></p>
            <p>Als u dit verzoek niet heeft gedaan, kunt u deze e-mail negeren.</p>
            <p>Met vriendelijke groet,<br>Het Activadis team</p>
        `
    })
};

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

async function sendMail(receiver, subject, content, isHTML = true) {
    try {
        const mailOptions = {
            from: '"Activadis" <activiteiten@activadis.shrt.now>',
            to: receiver,
            subject: subject,
        };

        if (isHTML) {
            mailOptions.html = emailTemplate(content, subject);
        } else {
            mailOptions.text = content;
        }

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Error sending email:', err);
        return { success: false, error: err.message };
    }
}

export default sendMail;
export {templates};