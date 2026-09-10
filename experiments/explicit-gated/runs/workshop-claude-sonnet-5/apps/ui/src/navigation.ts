/**
 * Where in the product the browser is.
 *
 * The three places a participant can arrive at directly — the list of
 * workshops, one workshop, and one offered place — are addressable, so a link
 * in a message can drop somebody straight onto the offer it is about.
 */

import { useEffect, useState } from "react";

export type Place =
  | { name: "workshops" }
  | { name: "workshop"; workshopId: string }
  | { name: "offer"; offeredPlaceId: string };

export function placeAddress(place: Place) {
  switch (place.name) {
    case "workshop":
      return `#/workshops/${encodeURIComponent(place.workshopId)}`;
    case "offer":
      return `#/offers/${encodeURIComponent(place.offeredPlaceId)}`;
    default:
      return "#/workshops";
  }
}

export function readPlace(hash: string): Place {
  const segments = hash.replace(/^#\/?/, "").split("/").filter((segment) => segment.length > 0);
  if (segments[0] === "workshops" && segments[1] !== undefined) {
    return { name: "workshop", workshopId: decodeURIComponent(segments[1]) };
  }
  if (segments[0] === "offers" && segments[1] !== undefined) {
    return { name: "offer", offeredPlaceId: decodeURIComponent(segments[1]) };
  }
  return { name: "workshops" };
}

export function goTo(place: Place) {
  window.location.hash = placeAddress(place);
}

export function usePlace() {
  const [place, setPlace] = useState<Place>(() => readPlace(window.location.hash));

  useEffect(() => {
    const follow = () => setPlace(readPlace(window.location.hash));
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);

  return place;
}
