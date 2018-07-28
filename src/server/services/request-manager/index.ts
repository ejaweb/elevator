import { simulatorCfg } from "../../config";
import { Elevator } from "../../modules";
import { IElevator, IElevatorInfo, IBuildingConfig } from "../../types";

const buildingConfig: IBuildingConfig = {
  elevators: [],
  numOfFloors: 0,
  numOfElevators: 0,
};

const findBestElevator = (floor: number, direction: string) => {
  let elevatorIndex = 0;
  const distanceOfElevators: any[] = [];

  buildingConfig.elevators.forEach((elevator, index) => {
    const eleInfo = elevator.getInfo();
    const distance = Math.abs(floor - eleInfo.floor);

    distanceOfElevators.push({
      index,
      distance,
    });
  });

  // sort elevator by distance numerically
  distanceOfElevators.sort((a, b) => a.distance - b.distance);
  elevatorIndex = distanceOfElevators[0].index;

  return elevatorIndex;
};

const generateBuilding = (socket: any): void => {
  const elevatorData = [];

  for (let i = 0; i < buildingConfig.numOfElevators; i++) {
    const rndFloor = Math.floor(Math.random() * buildingConfig.numOfFloors) + 1;
    const elevator: IElevator = new Elevator(simulatorCfg, buildingConfig, rndFloor, 0, "idle", socket);
    buildingConfig.elevators.push(elevator);
    elevatorData.push(elevator.getInfo());
  }

  socket.emit("elevators", elevatorData);
};

export const requestManager = (socket: any) => {
  socket.on("building", (data: IElevatorInfo) => {

    // evaluate minimum configuration
    const meetsMinimumElevators = data.numOfElevators >= simulatorCfg.minimumElevators;
    const meetsMinimumFloors = data.numOfFloors >= simulatorCfg.minimumFloors;
    const meetsMinimums = meetsMinimumElevators && meetsMinimumFloors;

    if (meetsMinimums) {
      buildingConfig.numOfFloors = data.numOfFloors;
      buildingConfig.numOfElevators = data.numOfElevators;
      buildingConfig.elevators.splice(0);
      generateBuilding(socket);
    }
  });

  socket.on("request", (data: IElevatorInfo) => {
    const selectedElevator = findBestElevator(data.floor, data.direction);
    let targetFloorVal: any = data.targetFloors ? data.targetFloors : data.floor;

    if (targetFloorVal.indexOf(",") > -1) {
      targetFloorVal = [];
      const elevatorNumbers = data.targetFloors.split(",");

      for (let i = 0; i < elevatorNumbers.length; i++) {
        targetFloorVal.push(elevatorNumbers[i]);
      }
    }
    
    buildingConfig.elevators[selectedElevator].gotoFloor(targetFloorVal);
  });
};
