import {
  world,
  system,
  WorldBeforeEvents,
  World,
  Vector3,
  DimensionLocation,
  Dimension,
  ScriptEventSource,
} from "@minecraft/server";
import { Molecule, deserializeMolecule } from "./molecule.js";
import { scanMoleculeAt } from "./areamolscanner.js";
import { MinecraftBiomeTypes, MinecraftBlockTypes } from "@minecraft/vanilla-data";
//Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
//np run local-deploy
function mainTick() {
  system.run(mainTick);
}
function interpretLocation(string: string): Vector3 {
  const stringArray: string[] = string.split(":");
  const x: number = Number(stringArray[0]);
  const y: number = Number(stringArray[1]);
  const z: number = Number(stringArray[2]);
  return { x: x, y: y, z: z };
}
function checkMolecule(startingPos: Vector3, molecule: string, dimension: Dimension | undefined): boolean {
  if (typeof dimension === "undefined") {
    return false;
  }
  let wantedMolecule: Molecule = deserializeMolecule(molecule);
  let builtMolecule: Molecule = scanMoleculeAt(startingPos, 15, dimension);
  return wantedMolecule.compare(builtMolecule);
}
//Run inits
world.beforeEvents.chatSend.subscribe((eventdata) => {
  if (eventdata.message === "yete") {
    world.sendMessage("moo");
    eventdata.cancel = true;
  }
});
system.afterEvents.scriptEventReceive.subscribe((eventData) => {
  if (eventData.id === "aon:molscan") {
    const stringArray: string[] = eventData.message.split(";");
    const initPos: Vector3 = interpretLocation(stringArray[0]);
    const redstoneBlockPos: Vector3 = interpretLocation(stringArray[1]);
    const dimension: Dimension | undefined =
      eventData.sourceType === ScriptEventSource.Block
        ? eventData.sourceBlock?.dimension
        : eventData.sourceEntity?.dimension;
    const bool: boolean = checkMolecule(initPos, stringArray[2], dimension);
    //world.sendMessage(String(bool));

    if (bool) {
      dimension?.runCommandAsync(
        "setblock " + redstoneBlockPos.x + " " + redstoneBlockPos.y + " " + redstoneBlockPos.z + " redstone_block"
      );
    }
  }
});

system.run(mainTick);
