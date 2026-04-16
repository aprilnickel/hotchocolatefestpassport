"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { useId } from "react";

type NeighbourhoodFilterProps = {
  options: string[];
  selectedOptions: string[];
  setSelectedOptions: (options: string[]) => void;
};

export function NeighbourhoodFilter({
  options,
  selectedOptions,
  setSelectedOptions,
}: NeighbourhoodFilterProps) {
  const neighbourhoodFilterId = useId();

  return (
    <>
      <Field className="block">
        <FieldLabel htmlFor={neighbourhoodFilterId} className="mb-1 block text-sm font-medium">Neighbourhood</FieldLabel>
        <Combobox
          items={options}
          multiple
          value={selectedOptions}
          onValueChange={setSelectedOptions}
        >
          <ComboboxChips className="w-full rounded-md border border-burgundy/40 bg-white text-base md:text-sm px-3 py-2 has-data-[slot=combobox-chip]:px-2">
            <ComboboxValue>
              {selectedOptions.map((option) => (
                <ComboboxChip key={option}>{option}</ComboboxChip>
              ))}
            </ComboboxValue>
            <ComboboxChipsInput id={neighbourhoodFilterId} placeholder="Select a neighbourhood" />
          </ComboboxChips>
          <ComboboxContent>
            <ComboboxEmpty>No neighbourhoods found.</ComboboxEmpty>
            <ComboboxList>
              {options.map((option) => (
                <ComboboxItem key={option} value={option}>{option}</ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    </>
  );
}
