import { blackAtom } from "./black-atom.ts";
import { iter } from "./iter.ts";
import { livery } from "./livery.ts";
import { radar } from "./radar.ts";
import type { Product } from "./types.ts";

export const products: readonly Product[] = [blackAtom, livery, iter, radar];
