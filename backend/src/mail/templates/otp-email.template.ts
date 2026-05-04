export const otpEmailTemplate = (otp: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>OTP Verification</title>
    </head>
    <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">
      
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            
            <table width="400" cellpadding="0" cellspacing="0" 
              style="background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
              
              <tr>
                <td align="center" style="padding-bottom:20px;">
                  <h2 style="margin:0; color:#2563eb;">TrackStack</h2>
                </td>
              </tr>
  
              <tr>
                <td style="text-align:center;">
                  <h3 style="margin:0 0 10px; color:#111;">Verify Your Identity</h3>
                  <p style="margin:0 0 20px; color:#555; font-size:14px;">
                    Use the OTP below to continue. This code expires in 10 minutes.
                  </p>
                </td>
              </tr>
  
              <tr>
                <td align="center" style="padding:20px 0;">
                  <div style="
                    display:inline-block;
                    padding:14px 28px;
                    font-size:24px;
                    letter-spacing:6px;
                    font-weight:bold;
                    color:#111;
                    background:#f1f5f9;
                    border-radius:8px;
                  ">
                    ${otp}
                  </div>
                </td>
              </tr>
  
              <tr>
                <td style="text-align:center;">
                  <p style="font-size:12px; color:#888;">
                    If you didn’t request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
  
            </table>
  
            <p style="margin-top:20px; font-size:12px; color:#aaa;">
              © ${new Date().getFullYear()} TrackStack. All rights reserved.
            </p>
  
          </td>
        </tr>
      </table>
  
    </body>
    </html>
    `;
};
