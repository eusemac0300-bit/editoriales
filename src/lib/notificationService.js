/**
 * Utility to send email notifications via FormSubmit.co
 * This allows sending emails from the frontend without a dedicated backend.
 * The first time it's used, the recipient (Euse) will need to click a confirm link.
 */
export async function sendAdminNotification({ subject, message, type = 'Notification' }) {
    // Current target email from user instructions
    const ADMIN_EMAIL = 'eusemac@me.com';
    const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${ADMIN_EMAIL}`;

    try {
        const response = await fetch(FORMSUBMIT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: `[Editorial Pro] ${subject}`,
                message: message,
                type: type,
                timestamp: new Date().toLocaleString(),
                _captcha: 'false' // Disable captcha for AJAX
            })
        });

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}
