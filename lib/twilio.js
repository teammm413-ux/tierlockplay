const twilio = require('twilio');

/**
 * Send SMS OTP via Twilio to USA Phone Number
 * @param {string} toPhone E.164 formatted phone number (e.g. +12025550192)
 * @param {string} code 6-digit verification OTP
 */
async function sendSmsOtp(toPhone, code) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  // Ensure phone has USA country code (+1)
  let formattedPhone = toPhone.trim().replace(/\D/g, '');
  if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
    formattedPhone = '1' + formattedPhone;
  }
  const e164Phone = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;

  const messageBody = `[Vegas Vault Casino] Your security verification code is: ${code}. Do not share this code with anyone. Valid for 10 minutes.`;

  // Real Twilio Client check
  if (accountSid && authToken && fromPhone && !accountSid.includes('your_') && accountSid.startsWith('AC')) {
    try {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: messageBody,
        from: fromPhone,
        to: e164Phone,
      });
      return {
        success: true,
        sid: message.sid,
        simulated: false,
        message: `OTP sent successfully to ${e164Phone} via Twilio!`,
      };
    } catch (err) {
      console.error('Twilio SMS Error:', err.message);
      return {
        success: false,
        error: err.message,
        simulated: false,
        code, // Return code in debug mode so user isn't stuck
      };
    }
  }

  // Fallback / Simulated mode when Twilio keys are not configured yet
  console.log(`[SIMULATED TWILIO SMS] To: ${e164Phone} | Code: ${code} | Message: ${messageBody}`);
  return {
    success: true,
    simulated: true,
    code,
    message: `[Dev/Demo Mode] OTP generated: ${code} (Set TWILIO_ACCOUNT_SID in .env for live SMS)`,
  };
}

module.exports = { sendSmsOtp };
