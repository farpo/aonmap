import { Block, BlockPermutation, BlockType, BlockTypes, Dimension, Vector3, world } from "@minecraft/server";
import { Molecule } from "./molecule";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";

export function scanMoleculeAt(center: Vector3, diameter: number, dimension: Dimension): Molecule {
  const half: number = (diameter - 1) / 2;
  let min: Vector3 = { x: center.x - half, y: center.y, z: center.z - half };
  let max: Vector3 = { x: center.x + half, y: center.y, z: center.z + half };

  const areascanner: AreaMolScanner = new AreaMolScanner(min, max, dimension).createDefaultMappings();
  areascanner.iterate();
  return areascanner.getMolecule();
}
class AreaMolScanner {
  mappings: Map<string, string>;
  dim: Dimension;
  min: Vector3;
  max: Vector3;
  molecule: Molecule;
  public constructor(min: Vector3, max: Vector3, dim: Dimension) {
    this.min = min;
    this.max = max;
    this.dim = dim;
    this.molecule = new Molecule();
    this.mappings = new Map();
  }
  public createDefaultMappings(): AreaMolScanner {
    this.mappings.set(MinecraftBlockTypes.CoalBlock, "C");
    this.mappings.set(MinecraftBlockTypes.WhiteConcrete, "H");
    this.mappings.set(MinecraftBlockTypes.RedConcrete, "O");
    this.mappings.set(MinecraftBlockTypes.BlueConcrete, "N");
    this.mappings.set(MinecraftBlockTypes.YellowConcrete, "S");
    this.mappings.set(MinecraftBlockTypes.LimeConcrete, "X");
    this.mappings.set(MinecraftBlockTypes.StoneBlockSlab, "singlebond");
    this.mappings.set(MinecraftBlockTypes.PolishedBlackstoneBrickSlab, "doublebond");
    this.mappings.set(MinecraftBlockTypes.StoneBlockSlab4, "triplebond");

    return this;
  }
  public iterate(): void {
    for (let x = this.min.x; x <= this.max.x; x++) {
      for (let z = this.min.z; z <= this.max.z; z++) {
        const type: string = this.getTypeAt(x, z);
        const symbol: string | undefined = this.mappings.get(type);
        if (typeof symbol !== "undefined") {
          if (symbol.length === 1) {
            this.processAtom(symbol);
          } else {
            this.processBond(symbol, x, z);
          }
        }
      }
    }
  }
  private processAtom(atom: string) {
    this.molecule.addAtom(atom);
  }
  private processBond(bond: string, x: number, z: number) {
    let a: string | undefined;
    let b: string | undefined;
    let orientation: boolean = false;
    const west: string | undefined = this.mappings.get(this.getTypeAt(x - 1, z));
    const north: string | undefined = this.mappings.get(this.getTypeAt(x, z - 1));
    if (typeof west !== "undefined") {
      const east: string | undefined = this.mappings.get(this.getTypeAt(x + 1, z));
      if (typeof east !== "undefined") {
        a = west;
        b = east;
      }
    } else if (typeof north !== "undefined") {
      const south: string | undefined = this.mappings.get(this.getTypeAt(x, z + 1));
      if (typeof south !== "undefined") {
        a = north;
        b = south;
        orientation = true;
      }
    }
    if (typeof a === "undefined" || typeof b === "undefined") {
      return;
    }
    switch (bond) {
      case "singlebond": {
        this.molecule.addSingleBond(a, b);
        break;
      }
      case "doublebond": {
        this.molecule.addDoubleBond(a, b);
        if ((a === "O" && b === "C") || (a === "C" && b === "O")) {
          this.determineCarbonyl(x, z, orientation);
        }
        break;
      }
      case "triplebond": {
        this.molecule.addTripleBond(a, b);
        break;
      }
    }
  }
  public determineCarbonyl(bondx: number, bondz: number, bondNorth: boolean): void {
    let carbonx = bondNorth ? bondx : bondx + 1;
    let carboxz = bondNorth ? bondz + 1 : bondz;
    let maybeCarbon: string | undefined = this.mappings.get(this.getTypeAt(carbonx, carboxz));
    let carbonMoreNegative: boolean = false;
    if (maybeCarbon !== "C") {
      carbonx = bondNorth ? bondx : bondx - 1;
      carboxz = bondNorth ? bondz - 1 : bondz;
      carbonMoreNegative = true;
    }
    let north: string | undefined = this.mappings.get(this.getTypeAt(carbonx, carboxz - 2));
    let west: string | undefined = this.mappings.get(this.getTypeAt(carbonx - 2, carboxz));
    let south: string | undefined = this.mappings.get(this.getTypeAt(carbonx, carboxz + 2));
    let east: string | undefined = this.mappings.get(this.getTypeAt(carbonx + 2, carboxz));

    if (bondNorth) {
      if (carbonMoreNegative) {
        south = undefined;
      } else {
        north = undefined;
      }
    } else {
      if (carbonMoreNegative) {
        east = undefined;
      } else {
        west = undefined;
      }
    }
    if (
      (north === "C" && south === "C") ||
      (east === "C" && west === "C") ||
      (north === "C" && west === "C") ||
      (south === "C" && east === "C") ||
      (north === "C" && east === "C") ||
      (south === "C" && west === "C")
    ) {
      this.molecule.ketone = true;
    } else if (
      (north === "C" && south === "O") ||
      (east === "C" && west === "O") ||
      (north === "C" && west === "O") ||
      (south === "C" && east === "O") ||
      (north === "C" && east === "O") ||
      (south === "C" && west === "O") ||
      (north === "O" && south === "C") ||
      (east === "O" && west === "C") ||
      (north === "O" && west === "C") ||
      (south === "O" && east === "C") ||
      (north === "O" && east === "C") ||
      (south === "O" && west === "C")
    ) {
      this.molecule.carboxy = true;
    }
  }
  public getTypeAt(x: number, z: number): string {
    const block: Block | undefined = this.dim.getBlock({ x: x, y: this.min.y, z: z });
    if (typeof block === "undefined") {
      return MinecraftBlockTypes.Air;
    } else {
      return block.typeId;
    }
  }
  public getMolecule(): Molecule {
    return this.molecule;
  }
}
