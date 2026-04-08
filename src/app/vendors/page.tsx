import { getAllVendors, Vendor } from "@/lib/queries";
import { VendorCard } from "./vendor-card";

export const metadata = {
  title: "Vendors | Sip Fest Passport",
  description: "Browse all Vancouver Hot Chocolate Festival vendors.",
};

export default async function VendorsPage() {
  const vendorList = await getAllVendors();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold hidden md:block">Vendors</h1>
      {vendorList.length === 0 ? (
        <p>There are no vendors yet. Check back later for updates.</p>
      ) : (
        <ul className="space-y-3">
          {vendorList.map((vendor: Vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
