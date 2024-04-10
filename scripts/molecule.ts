import { world } from "@minecraft/server";

export class Molecule {
  atoms: Map<string, number>;
  singleBonds: Map<string, number>;
  doubleBonds: Map<string, number>;
  tripleBonds: Map<string, number>;
  ketone: boolean;
  carboxy: boolean;

  public constructor() {
    this.atoms = new Map();
    this.singleBonds = new Map();
    this.doubleBonds = new Map();
    this.tripleBonds = new Map();
    this.ketone = false;
    this.carboxy = false;
  }
  public toString(): string {
    return (
      "atoms: " +
      JSON.stringify(Object.fromEntries(this.atoms)) +
      " singlebonds: " +
      JSON.stringify(Object.fromEntries(this.singleBonds)) +
      " doublebonds: " +
      JSON.stringify(Object.fromEntries(this.doubleBonds)) +
      " triplebonds: " +
      JSON.stringify(Object.fromEntries(this.tripleBonds)) +
      " ketone: " +
      this.ketone +
      " carboxy: " +
      this.carboxy
    );
  }
  public addAllAtoms(atoms: string[]): void {
    atoms.forEach((element) => {
      const key: string = element.substring(0, 1);
      const amount: number = Number(element.substring(1));
      this.atoms.set(key, amount);
    });
  }
  public addAllSingleBonds(bonds: string[]): void {
    bonds.forEach((element) => {
      const key: string = sortAtoms(element.substring(0, 2));
      const amount: number = Number(element.substring(2));
      this.singleBonds.set(key, amount);
    });
  }
  public addAllDoubleBonds(bonds: string[]): void {
    bonds.forEach((element) => {
      const key: string = sortAtoms(element.substring(0, 2));
      const amount: number = Number(element.substring(2));
      this.doubleBonds.set(key, amount);
    });
  }
  public addAllTripleBonds(bonds: string[]): void {
    bonds.forEach((element) => {
      const key: string = sortAtoms(element.substring(0, 2));
      const amount: number = Number(element.substring(2));
      this.tripleBonds.set(key, amount);
    });
  }
  public addAtom(atom: string): void {
    let amount: number | undefined = this.atoms.get(atom);
    if (typeof amount === "undefined") {
      amount = 1;
    } else {
      amount++;
    }
    this.atoms.set(atom, amount);
  }
  public addSingleBond(one: string, two: string): void {
    const key: string = processStrings(one, two);
    let amount: number | undefined = this.singleBonds.get(key);
    if (typeof amount === "undefined") {
      amount = 1;
    } else {
      amount++;
    }

    this.singleBonds.set(key, amount);
  }
  public addDoubleBond(one: string, two: string): void {
    const key: string = processStrings(one, two);
    let amount: number | undefined = this.doubleBonds.get(key);
    if (typeof amount === "undefined") {
      amount = 1;
    } else {
      amount++;
    }

    this.doubleBonds.set(key, amount);
  }
  public addTripleBond(one: string, two: string): void {
    const key: string = processStrings(one, two);
    let amount: number | undefined = this.tripleBonds.get(key);
    if (typeof amount === "undefined") {
      amount = 1;
    } else {
      amount++;
    }

    this.tripleBonds.set(key, amount);
  }
  public compare(another: Molecule): boolean {
    //world.sendMessage("Molecule 1 : " + this.toString());
    //world.sendMessage("Molecule 2 : " + another.toString());

    if (this.ketone !== another.ketone || this.carboxy !== another.carboxy) {
      return false;
    }
    return (
      compareMaps(this.atoms, another.atoms) &&
      compareMaps(this.singleBonds, another.singleBonds) &&
      compareMaps(this.doubleBonds, another.doubleBonds) &&
      compareMaps(this.tripleBonds, another.tripleBonds)
    );
  }
}
function compareMaps(map1: Map<string, number>, map2: Map<string, number>) {
  let testVal;
  if (map1.size !== map2.size) {
    return false;
  }
  for (let [key, val] of map1) {
    testVal = map2.get(key);
    // in cases of an undefined value, make sure the key
    // actually exists on the object so there are no false positives
    if (testVal !== val || (testVal === undefined && !map2.has(key))) {
      return false;
    }
  }
  return true;
}
export function deserializeMolecule(string: string): Molecule {
  const molecule: Molecule = new Molecule();
  const sections: string[] = string.split(":");
  molecule.addAllAtoms(sections[0].split("/"));
  if (sections[1] !== "") {
    molecule.addAllSingleBonds(sections[1].split("/"));
  }
  if (sections[2] !== "") {
    molecule.addAllDoubleBonds(sections[2].split("/"));
  }
  if (sections[3] !== "") {
    molecule.addAllTripleBonds(sections[3].split("/"));
  }
  if (sections[4] === "K") {
    molecule.ketone = true;
  } else if (sections[4] === "A") {
    molecule.carboxy = true;
  }
  return molecule;
}
function sortAtoms(string: string): string {
  return processStrings(string.substring(0, 1), string.substring(1));
}
function processStrings(one: string, two: string): string {
  const sortedArray: string[] = [one, two].sort();
  const string: string = sortedArray[0] + sortedArray[1];
  return string;
}
