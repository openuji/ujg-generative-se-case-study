import type { ReactNode } from "react";

export interface EmailOfferMessageProps {
  emailBody: ReactNode;
  emailLinkAction: ReactNode;
}

export function EmailOfferMessage({ emailBody, emailLinkAction }: EmailOfferMessageProps) {
  return (
    <table className="w-full max-w-lg border-collapse rounded-lg border border-line bg-raised" role="presentation">
      <tbody>
        <tr>
          <td className="p-6">{emailBody}</td>
        </tr>
        <tr>
          <td className="px-6 pb-6">{emailLinkAction}</td>
        </tr>
      </tbody>
    </table>
  );
}
