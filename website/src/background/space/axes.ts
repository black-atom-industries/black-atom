import { Vector3 } from "three/webgpu";

/** The field's main flow direction, which every landmark's lines follow. */
export const flowDir = new Vector3(0.55, -0.8, 0.06).normalize();
/** The normal of the sheet the field flows in. */
const sheetNormal = new Vector3(0.05, 0.16, 1).normalize();
/** Across the flow, within the sheet. */
export const flowSide = new Vector3().crossVectors(sheetNormal, flowDir).normalize();
/** Off the sheet, the side a flight's arc lifts toward. */
export const flowUp = new Vector3().crossVectors(flowDir, flowSide).normalize();
