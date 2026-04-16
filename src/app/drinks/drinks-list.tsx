"use client";

import { useMemo, useState } from "react";
import type { DrinkWithVendor } from "@/lib/queries";
import { DrinkCard } from "./drink-card";
import { NeighbourhoodFilter } from "./neighbourhood-filter";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputClear } from "@/components/ui/input-clear";

type DrinksListProps = {
  drinks: DrinkWithVendor[];
  wishlistDrinkIds: string[];
  showWishlistButton: boolean;
};

export function DrinksList({
  drinks,
  wishlistDrinkIds,
  showWishlistButton,
}: DrinksListProps) {
  const [search, setSearch] = useState("");
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState<string[]>([]);

  const wishlistIdSet = useMemo(
    () => new Set(wishlistDrinkIds),
    [wishlistDrinkIds]
  );

  const neighbourhoodOptions = useMemo(() => {
    const names = new Set<string>();
    for (const drink of drinks) {
      for (const location of drink.vendor.vendorLocations) {
        const neighbourhood = location.neighbourhood?.trim();
        if (neighbourhood) names.add(neighbourhood);
      }
    }
    return [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [drinks]);

  const filteredDrinks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drinks.filter((drink) => {
      const matchesSearch =
        query.length === 0 ||
        drink.name.toLowerCase().includes(query) ||
        drink.vendor.name.toLowerCase().includes(query) ||
        (drink.flavourNotes?.toLowerCase().includes(query) ?? false);

      const matchesNeighbourhood =
        selectedNeighbourhood.length === 0 ||
        drink.vendor.vendorLocations.some(
          (location) =>
            selectedNeighbourhood.includes(location.neighbourhood?.trim() ?? "")
        );

      return matchesSearch && matchesNeighbourhood;
    });
  }, [drinks, search, selectedNeighbourhood]);

  return (
    <>
      <FieldGroup className="grid sm:grid-cols-2 gap-3 rounded-lg border border-burgundy/30 mb-4 p-3 text-sm">
        <Field className="block">
          <FieldLabel htmlFor="search" className="mb-1 block text-sm font-medium">Search</FieldLabel>
          <InputClear
            id="search"
            value={search}
            setValue={setSearch}
            placeholder="Drink, vendor, or flavour notes"
            className="rounded-md bg-white pl-3 pr-8 py-2 min-h-8 h-auto"
          />
        </Field>

        <NeighbourhoodFilter
          options={neighbourhoodOptions}
          selectedOptions={selectedNeighbourhood}
          setSelectedOptions={setSelectedNeighbourhood}
        />
      </FieldGroup>

      {filteredDrinks.length === 0 ? (
        <p>No drinks match your current search and filters.</p>
      ) : (
        <ul className="space-y-3">
          {filteredDrinks.map((drink) => (
            <DrinkCard
              key={drink.id}
              drink={drink}
              inWishlist={wishlistIdSet.has(drink.id)}
              showWishlistButton={showWishlistButton}
            />
          ))}
        </ul>
      )}
    </>
  );
}
