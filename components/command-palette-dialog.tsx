"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { Dispatch, SetStateAction } from "react";
import type { CommandAction } from "./command-palette";

type CommandPaletteDialogProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  selected: CommandAction | null;
  setQuery: Dispatch<SetStateAction<string>>;
  filteredActions: CommandAction[];
  onSelect: (action: CommandAction | null) => void;
};

export function CommandPaletteDialog({
  isOpen,
  setIsOpen,
  selected,
  setQuery,
  filteredActions,
  onSelect,
}: CommandPaletteDialogProps) {
  return (
    isOpen ? (
      <Dialog open={isOpen} onClose={setIsOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-palette-overlay-in motion-reduce:animate-none" />

        <div className="fixed inset-0 flex items-start justify-center px-4 pt-20 sm:pt-28">
          <DialogPanel className="w-full max-w-2xl">
            <div className="animate-palette-panel-in rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-glow motion-reduce:animate-none">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <DialogTitle className="text-sm font-semibold tracking-[0.18em] text-phosphor">
                  COMMAND PALETTE
                </DialogTitle>
                <span className="text-xs text-neutral-400">ESC</span>
              </div>

              <Combobox value={selected} onChange={onSelect}>
                <div className="border-b border-white/10 px-3 py-2">
                  <ComboboxInput
                    autoFocus
                    className="w-full border-none bg-transparent px-2 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
                    displayValue={(action: CommandAction | null) => action?.label ?? ""}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Type a command or section..."
                  />
                </div>

                <ComboboxOptions static className="max-h-80 overflow-y-auto p-2">
                  {filteredActions.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-neutral-400">No matching command found.</div>
                  ) : (
                    filteredActions.map((action) => (
                      <ComboboxOption
                        key={action.id}
                        value={action}
                        className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 transition data-[focus]:border-phosphor/60 data-[focus]:bg-phosphor/10"
                      >
                        <p className="text-sm font-semibold text-neutral-100">{action.label}</p>
                        <p className="mt-1 text-xs text-neutral-400">{action.hint}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-phosphor/80">
                          {action.section}
                        </p>
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              </Combobox>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    ) : null
  );
}