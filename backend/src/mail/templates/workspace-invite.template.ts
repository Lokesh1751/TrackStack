// src/common/templates/workspace-invite.template.ts

export const workspaceInviteTemplate = (
  invitedBy: string,
  workspaceName: string,
  acceptInviteLink: string,
  declineInviteLink: string,
) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Workspace Invitation</title>
      </head>
  
      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="padding: 40px 0;"
        >
          <tr>
            <td align="center">
              <table
                width="600"
                cellpadding="0"
                cellspacing="0"
                style="
                  background: #ffffff;
                  border-radius: 20px;
                  overflow: hidden;
                  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
                "
              >
                <!-- HEADER -->
                <tr>
                  <td
                    style="
                      background: linear-gradient(135deg, #7189D0, #4f46e5);
                      padding: 40px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: white;
                        font-size: 32px;
                        font-weight: 700;
                      "
                    >
                      TrackStack
                    </h1>
  
                    <p
                      style="
                        margin-top: 12px;
                        color: rgba(255,255,255,0.85);
                        font-size: 15px;
                      "
                    >
                      Workspace Collaboration Invitation
                    </p>
                  </td>
                </tr>
  
                <!-- BODY -->
                <tr>
                  <td style="padding: 45px 40px;">
                    <h2
                      style="
                        margin: 0;
                        font-size: 28px;
                        color: #111827;
                      "
                    >
                      You're Invited 🚀
                    </h2>
  
                    <p
                      style="
                        margin-top: 20px;
                        color: #4b5563;
                        font-size: 16px;
                        line-height: 28px;
                      "
                    >
                      <strong>${invitedBy}</strong> has invited you to join the
                      workspace
                      <strong style="color:#111827;">
                        ${workspaceName}
                      </strong>
                      on TrackStack.
                    </p>
  
                    <!-- WORKSPACE CARD -->
                    <div
                      style="
                        margin-top: 30px;
                        border: 1px solid #e5e7eb;
                        border-radius: 16px;
                        padding: 24px;
                        background: #fafafa;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 14px;
                          color: #6b7280;
                        "
                      >
                        Workspace
                      </p>
  
                      <h3
                        style="
                          margin-top: 10px;
                          margin-bottom: 0;
                          font-size: 24px;
                          color: #111827;
                        "
                      >
                        ${workspaceName}
                      </h3>
                    </div>
  
                    <!-- INFO -->
                    <div
                      style="
                        margin-top: 28px;
                        padding: 18px;
                        border-radius: 14px;
                        background: #eef3ff;
                        border: 1px solid #dbe4ff;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 14px;
                          line-height: 24px;
                          color: #4b5563;
                        "
                      >
                        Once accepted, you’ll be able to access workspace projects,
                        collaborate with team members, manage sprint workflows,
                        participate in task discussions and contribute to agile delivery.
                      </p>
                    </div>
  
                    <!-- BUTTON -->
                    <div style="margin-top: 40px; text-align: center;">
                      <a
                        href="${acceptInviteLink}"
                        style="
                          display: inline-block;
                          background: #7189D0;
                          color: white;
                          text-decoration: none;
                          padding: 16px 32px;
                          border-radius: 12px;
                          font-size: 15px;
                          font-weight: 600;
                        "
                      >
                        Accept Invitation
                      </a>

                      <a
                        href="${declineInviteLink}"
                        style="
                          display: inline-block;
                          background: red;
                          color: white;
                          text-decoration: none;
                          padding: 16px 32px;
                          border-radius: 12px;
                          font-size: 15px;
                          font-weight: 600;
                        "
                      >
                        Decline Invitation
                      </a>
                    </div>
  
                    <!-- FOOTER TEXT -->
                    <p
                      style="
                        margin-top: 40px;
                        font-size: 14px;
                        line-height: 24px;
                        color: #6b7280;
                      "
                    >
                      This invitation will expire in
                      <strong>24 hours</strong>.
                    </p>
  
                    <p
                      style="
                        margin-top: 10px;
                        font-size: 14px;
                        line-height: 24px;
                        color: #9ca3af;
                      "
                    >
                      If you did not expect this invitation, you can safely ignore
                      this email.
                    </p>
                  </td>
                </tr>
  
                <!-- FOOTER -->
                <tr>
                  <td
                    style="
                      padding: 24px;
                      text-align: center;
                      background: #f9fafb;
                      border-top: 1px solid #e5e7eb;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 13px;
                        color: #9ca3af;
                      "
                    >
                      © ${new Date().getFullYear()} TrackStack. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
};
