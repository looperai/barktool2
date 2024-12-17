export type NRMElement = {
  [key: string]: NRMElement | Record<string, never>;
};

export const nrmData: NRMElement = {
  "1 Sub-structure": {
    "1.1 Foundations and piling": {},
    "1.2 Basement retaining walls and lowest slab": {
      "1.2.1 Lowest slab": {},
      "1.2.2 Suspended slabs": {},
      "1.2.3 Basement retaining walls": {}
    }
  },
  "2 Super structure": {
    "2.1 Frame": {
      "2.1.1 Frame (vertical) - columns/structural walls & braces": {},
      "2.1.2 Frame (Horizontal) - beams, joists & braces": {}
    },
    "2.2 Upper floors": {
      "2.2.1 Upper floor - structural slabs": {},
      "2.2.2 Upper floor - non-structural slabs": {}
    },
    "2.3 Roof": {
      "2.3.1 Roof - structural elements": {},
      "2.3.2 Roof - non-structural elements": {}
    },
    "2.4 Stairs and ramps": {
      "2.4.1 Stairs": {},
      "2.4.2 Ramps": {}
    },
    "2.5 External walls": {
      "2.5.1 External walls - structural": {},
      "2.5.2 External walls - non-structural": {}
    },
    "2.6 Windows and external doors": {
      "2.6.1 Windows": {},
      "2.6.2 External doors": {}
    },
    "2.7 Internal walls and partitions": {
      "2.7.1 Internal walls - structural": {},
      "2.7.2 Internal walls - non-structural": {},
      "2.7.3 Internal doors": {}
    }
  },
  "3 Finishes": {
    "3.1 Wall finishes": {
      "3.1.1 External wall finishes": {},
      "3.1.2 Internal wall finishes": {}
    },
    "3.2 Floor finishes": {
      "3.2.1 Floor finishes - screed": {},
      "3.2.2 Floor finishes - other": {}
    },
    "3.3 Ceiling finishes": {
      "3.3.1 Suspended ceilings": {},
      "3.3.2 Other ceiling finishes": {}
    }
  }
}; 