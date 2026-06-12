import { CargoGrid } from "./wiki-vehicle.models.js";

export const SCU_SIZE = [1, 2, 4, 8, 16, 24, 32] as const;
export type ScuSize = (typeof SCU_SIZE)[number];

interface Vec3 {
    w: number;
    h: number;
    l: number;
}

export const SCU_BOX: Record<ScuSize, Vec3> = {
    1: { w: 1.25, h: 1.25, l: 1.25 },
    2: { w: 1.25, h: 1.25, l: 2.5 },
    4: { w: 2.5, h: 1.25, l: 2.5 },
    8: { w: 2.5, h: 2.5, l: 2.5 },
    16: { w: 2.5, h: 2.5, l: 5 },
    24: { w: 2.5, h: 2.5, l: 7.5 },
    32: { w: 2.5, h: 2.5, l: 10 }
};

/** Converts the metric values of a cargo grid object to scu-relative values, and calculates the correct max_scu_box
 * value for the grid, which is incorrect for a lot of the raw data.  */
export function metricToSCUCargoGrid(gridMetric: CargoGrid): CargoGrid {
    const scuWidth = gridMetric.width / SCU_BOX[1].w;
    const scuHeight = gridMetric.height / SCU_BOX[1].h;
    const scuLength = gridMetric.length / SCU_BOX[1].l;
    const maxScuBox =
        [...SCU_SIZE].reverse().find((boxSize) => fitsWithinSCUGrid(boxSize, scuWidth, scuHeight, scuLength)) ?? 0;

    return {
        uuid: gridMetric.uuid,
        width: scuWidth,
        height: scuHeight,
        length: scuLength,
        volume: gridMetric.volume,
        scu: gridMetric.scu,
        open: gridMetric.open,
        external: gridMetric.external,
        closed: gridMetric.closed,
        max_scu_box: maxScuBox
    };
}

function fitsWithinSCUGrid(boxSize: ScuSize, scuWidth: number, scuHeight: number, scuLength: number): boolean {
    const box = SCU_BOX[boxSize];
    let boxDimsSorted = [box.w, box.h, box.l].map((bd) => bd / SCU_BOX[1].w).sort((a, b) => a - b);
    let gridDimsSorted = [scuWidth, scuHeight, scuLength].sort((a, b) => a - b);
    return boxDimsSorted.every((bd, i) => bd <= gridDimsSorted[i]);
}
