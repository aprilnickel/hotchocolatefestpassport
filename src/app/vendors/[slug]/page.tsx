import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getVendorBySlug,
  getDrinksByVendorId,
  getVendorLocations,
  getVendorUrls,
} from "@/lib/queries";
import { ExternalLinkIcon } from "@/components/icons/external-link-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { TikTokIcon } from "@/components/icons/tiktok-icon";
import { XIcon } from "@/components/icons/x-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";

const vendorUrlIconMap = {
  facebook: {
    label: "Facebook",
    icon: FacebookIcon,
  },
  instagram: {
    label: "Instagram",
    icon: InstagramIcon,
  },
  tiktok: {
    label: "TikTok",
    icon: TikTokIcon,
  },
  twitter: {
    label: "Twitter / X",
    icon: XIcon,
  },
  youtube: {
    label: "YouTube",
    icon: YoutubeIcon,
  },
};

function isSocialLink(type: string | null): boolean {
  return type !== null && type !== "website";
}

function SocialIconAnchor({
  url,
  type,
}: {
  url: string;
  type: string | null;
}) {
  const { label, icon: Icon } = vendorUrlIconMap[type as keyof typeof vendorUrlIconMap];
  if (!label || !Icon) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[30px] min-w-[30px] items-center rounded-sm justify-center bg-cream text-burgundy hover:bg-burgundy-dark hover:text-cream"
      aria-label={`${label} (opens in new tab)`}
    >
      <Icon className="size-6 shrink-0" />
    </a>
  );
}

function WebsiteLinkAnchor({
  url,
  type,
}: {
  url: string;
  type: string | null;
}) {
  const label = type === "website" ? "Visit website" : url;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium underline hover:no-underline inline-link"
      aria-label={`${label} (opens in new tab)`}
    >
      <span className="min-w-0 break-all">{label}</span>
      <ExternalLinkIcon className="size-4 shrink-0" />
    </a>
  );
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const [vendorDrinks, locations, urls] = await Promise.all([
    getDrinksByVendorId(vendor.id),
    getVendorLocations(vendor.id),
    getVendorUrls(vendor.id),
  ]);

  const socialUrls = urls.filter((u) => isSocialLink(u.type));
  const websiteUrl = urls.find((u) => u.type === "website");
  const otherUrls = urls.filter((u) => !isSocialLink(u.type) && u.type !== "website");

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/drinks"
        className="mb-4 inline-block text-sm font-medium inline-link"
      >
        ← All drinks
      </Link>
      <article className="rounded-lg border border-burgundy/50 p-6 shadow-md">
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        {vendor.description && (
          <p className="mt-2 text-sm opacity-90">{vendor.description}</p>
        )}
        {socialUrls.length > 0 ? (
          <ul className="mt-4 flex gap-2 flex-wrap">
            {socialUrls.map((u) => (
              <li key={u.id}>
                <SocialIconAnchor url={u.url} type={u.type} />
              </li>
            ))}
          </ul>
        ) : null}
        {websiteUrl && websiteUrl.url ? (
          <ul className="mt-4 flex flex-col gap-1 flex-wrap">
            <li  key={websiteUrl.id}>
              <WebsiteLinkAnchor url={websiteUrl.url} type={websiteUrl.type} />
            </li>
            {otherUrls.map((u) => (
              <li key={u.id}>
                <WebsiteLinkAnchor url={u.url} type={u.type} />
              </li>
            ))}
          </ul>
        ) : null}
        <h2 className="mt-6 text-lg font-semibold">
          Locations
        </h2>
        {locations.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {locations.map((loc) => (
              <li key={loc.id} className="border-t border-burgundy/20 pt-3 first:border-t-0 first:pt-0">
                <p className="font-medium">{loc.name}</p>
                {loc.neighbourhood && (
                  <p className="mt-1 text-sm">{loc.neighbourhood}</p>
                )}
                {loc.address && (
                  <p className="mt-1 text-sm opacity-80">{loc.address}</p>
                )}
                {loc.hours && (
                  <p className="mt-1 text-sm opacity-80">{loc.hours}</p>
                )}
              </li>
            ))}
          </ul>
        ) : null}
        <h2 className="mt-6 text-lg font-semibold">
          Drinks at this vendor
        </h2>
        <ul className="mt-2 space-y-2">
          {vendorDrinks.map((d) => (
            <li key={d.id}>
              <Link
                href={`/drinks/${d.slug}`}
                className="hover:underline inline-link"
              >
                <span className="opacity-80 font-normal">{d.externalId ? `#${d.externalId} — ` : ""}</span>
                {d.name}
                {d.flavourNotes ? ` — ${d.flavourNotes}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
