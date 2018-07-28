export interface IBuildingConfig {
    elevators: IElevator[];
    numOfFloors: number;
    numOfElevators: number;
}

export interface IElevator {
    getInfo: () => IElevatorInfo;
    gotoFloor: (floor: number | number[]) => void;
}

export interface IElevatorInfo {
    floor: number;
    trips: number;
    direction: string;
    moving: boolean;
    service: boolean;
    elevatorID: string;
    numOfFloors: number;
    numOfElevators: number;
    targetFloors?: any;
}

export interface IElevatorQueue {
    uid?: string;
    floor: number;
}

export interface ISimulatorCfg {
    maxTrips: number;
    minimumFloors: number;
    minimumElevators: number;
    elevatorTransitSpeedMS: number;
    elevatorDropoffSpeedMS: number;
}
