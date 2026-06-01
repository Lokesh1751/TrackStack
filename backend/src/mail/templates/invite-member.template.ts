export const inviteMemberTemplate = (
  invitedBy: string,
  projectName: string,
  acceptInviteLink: string,
  declineInviteLink: string,
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Project Invitation</title>
    </head>

    <body
      style="
        margin: 0;
        padding: 0;
        background: #f3f5fb;
        font-family: Arial, Helvetica, sans-serif;
      "
    >
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="padding: 50px 16px;"
      >
        <tr>
          <td align="center">
            <table
              width="620"
              cellpadding="0"
              cellspacing="0"
              style="
                background: #ffffff;
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 0 12px 40px rgba(15,23,42,0.08);
              "
            >
              <!-- HEADER -->
              <tr>
                <td
                  style="
                    background: linear-gradient(135deg, #7189D0 0%, #4f46e5 100%);
                    padding: 50px 40px;
                    text-align: center;
                  "
                >

                  <h1
                    style="
                      margin: 0;
                      color: white;
                      font-size: 34px;
                      font-weight: 800;
                    "
                  >
                    TrackStack
                  </h1>

                  <p
                    style="
                      margin-top: 14px;
                      color: rgba(255,255,255,0.85);
                      font-size: 15px;
                      line-height: 24px;
                    "
                  >
                    Agile Project Collaboration Platform
                  </p>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding: 48px 42px;">
                  <div
                    style="
                      display: inline-block;
                      background: #eef2ff;
                      color: #5b6fd6;
                      padding: 8px 16px;
                      border-radius: 999px;
                      font-size: 12px;
                      font-weight: 700;
                      letter-spacing: 0.08em;
                      text-transform: uppercase;
                    "
                  >
                    Project Invitation
                  </div>

                  <h2
                    style="
                      margin-top: 24px;
                      margin-bottom: 0;
                      font-size: 32px;
                      line-height: 42px;
                      color: #111827;
                    "
                  >
                    You're Invited 🎉
                  </h2>

                  <p
                    style="
                      margin-top: 22px;
                      color: #4b5563;
                      font-size: 16px;
                      line-height: 30px;
                    "
                  >
                    <strong style="color:#111827;">
                      ${invitedBy}
                    </strong>
                    has invited you to collaborate on the project
                    <strong style="color:#111827;">
                      ${projectName}
                    </strong>
                    in TrackStack.
                  </p>

                  <!-- PROJECT CARD -->
                  <div
                    style="
                      margin-top: 34px;
                      background: linear-gradient(180deg, #fafbff 0%, #f4f7ff 100%);
                      border: 1px solid #dbe4ff;
                      border-radius: 22px;
                      padding: 28px;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 13px;
                        color: #718096;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        font-weight: 700;
                      "
                    >
                      Project Workspace
                    </p>

                    <h3
                      style="
                        margin-top: 14px;
                        margin-bottom: 0;
                        font-size: 28px;
                        line-height: 38px;
                        color: #111827;
                      "
                    >
                      ${projectName}
                    </h3>

                    <p
                      style="
                        margin-top: 14px;
                        margin-bottom: 0;
                        font-size: 15px;
                        line-height: 26px;
                        color: #6b7280;
                      "
                    >
                      Collaborate with your team, manage agile tasks,
                      track sprint progress, and deliver projects faster.
                    </p>
                  </div>

                  <!-- FEATURES -->
                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="margin-top: 28px;"
                  >
                    <tr>
                      <td
                        style="
                          width: 33%;
                          padding-right: 8px;
                        "
                      >
                        <div
                          style="
                            background: #f9fafb;
                            border: 1px solid #eceff5;
                            border-radius: 18px;
                            padding: 20px;
                            text-align: center;
                          "
                        >
                          <div
                            style="
                              font-size: 20px;
                              font-weight: 800;
                              color: #111827;
                            "
                          >
                            Tasks
                          </div>

                          <p
                            style="
                              margin-top: 8px;
                              margin-bottom: 0;
                              font-size: 13px;
                              color: #6b7280;
                            "
                          >
                            Agile workflow
                          </p>
                        </div>
                      </td>

                      <td
                        style="
                          width: 33%;
                          padding: 0 4px;
                        "
                      >
                        <div
                          style="
                            background: #f9fafb;
                            border: 1px solid #eceff5;
                            border-radius: 18px;
                            padding: 20px;
                            text-align: center;
                          "
                        >
                          <div
                            style="
                              font-size: 20px;
                              font-weight: 800;
                              color: #111827;
                            "
                          >
                            Sprints
                          </div>

                          <p
                            style="
                              margin-top: 8px;
                              margin-bottom: 0;
                              font-size: 13px;
                              color: #6b7280;
                            "
                          >
                            Track progress
                          </p>
                        </div>
                      </td>

                      <td
                        style="
                          width: 33%;
                          padding-left: 8px;
                        "
                      >
                        <div
                          style="
                            background: #f9fafb;
                            border: 1px solid #eceff5;
                            border-radius: 18px;
                            padding: 20px;
                            text-align: center;
                          "
                        >
                          <div
                            style="
                              font-size: 20px;
                              font-weight: 800;
                              color: #111827;
                            "
                          >
                            Teamwork
                          </div>

                          <p
                            style="
                              margin-top: 8px;
                              margin-bottom: 0;
                              font-size: 13px;
                              color: #6b7280;
                            "
                          >
                            Collaborate
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- BUTTON -->
                  <div style="margin-top: 42px; text-align: center;">
                    <a
                      href="${acceptInviteLink}"
                      style="
                        display: inline-block;
                        background: linear-gradient(135deg, #7189D0 0%, #4f46e5 100%);
                        color: white;
                        text-decoration: none;
                        padding: 18px 36px;
                        border-radius: 16px;
                        font-size: 15px;
                        font-weight: 700;
                        box-shadow: 0 10px 24px rgba(79,70,229,0.25);
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
                        padding: 18px 36px;
                        border-radius: 16px;
                        font-size: 15px;
                        font-weight: 700;
                        box-shadow: 0 10px 24px rgba(79,70,229,0.25);
                      "
                    >
                      Decline Invitation
                    </a>
                  </div>

                  <!-- FOOTER TEXT -->
                  <p
                    style="
                      margin-top: 42px;
                      font-size: 14px;
                      line-height: 26px;
                      color: #6b7280;
                    "
                  >
                    This invitation will expire in
                    <strong style="color:#111827;">
                      24 hours
                    </strong>.
                  </p>

                  <p
                    style="
                      margin-top: 12px;
                      font-size: 14px;
                      line-height: 26px;
                      color: #9ca3af;
                    "
                  >
                    If you did not expect this invitation,
                    you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td
                  style="
                    padding: 28px;
                    text-align: center;
                    background: #f8fafc;
                    border-top: 1px solid #edf1f7;
                  "
                >
                  <p
                    style="
                      margin: 0;
                      font-size: 13px;
                      color: #94a3b8;
                    "
                  >
                    © ${new Date().getFullYear()} TrackStack.
                    All rights reserved.
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
