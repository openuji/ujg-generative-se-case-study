import { usePathname, matchRoute } from "./router";
import { WorkshopsPage } from "./pages/WorkshopsPage";
import { WorkshopDetailPage } from "./pages/WorkshopDetailPage";
import { RegistrationPage } from "./pages/RegistrationPage";
import { WaitlistPage } from "./pages/WaitlistPage";
import { OfferPage } from "./pages/OfferPage";

export function App() {
  const pathname = usePathname();

  const offerMatch = matchRoute(pathname, "/offers/:offerId");
  if (offerMatch) return <OfferPage offerId={offerMatch.offerId} />;

  const registerMatch = matchRoute(pathname, "/workshops/:workshopId/register");
  if (registerMatch) return <RegistrationPage workshopId={registerMatch.workshopId} />;

  const waitlistMatch = matchRoute(pathname, "/workshops/:workshopId/waitlist");
  if (waitlistMatch) return <WaitlistPage workshopId={waitlistMatch.workshopId} />;

  const detailMatch = matchRoute(pathname, "/workshops/:workshopId");
  if (detailMatch) return <WorkshopDetailPage workshopId={detailMatch.workshopId} />;

  return <WorkshopsPage />;
}
