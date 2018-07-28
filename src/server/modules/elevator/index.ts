import { 
    IBuildingConfig, IElevator, IElevatorInfo, 
    IElevatorQueue, ISimulatorCfg, 
} from "../../types";

export class Elevator implements IElevator {
    private moving: boolean = false;
    private service: boolean = false;
    private elevatorID: string = "";
    private numOfFloors: number = 0;
    private numOfElevators: number = 0;
    private elevatorQueue: IElevatorQueue[] = [];

    // shorthand constructor
    constructor(
        private config: ISimulatorCfg,
        private buildingConfig: IBuildingConfig, 
        private floor: number = 1, 
        private trips: number = 0, 
        private direction: string = "idle",
        private socket?: any,
    ) {
        this.socket = socket ? socket : false;
        this.elevatorID = Math.random().toString(36).substr(2, 9);
        this.numOfFloors = buildingConfig.numOfFloors;
        this.numOfElevators = buildingConfig.numOfElevators;
    }

    public getInfo(): IElevatorInfo {
        return {
            floor: this.floor,
            trips: this.trips,
            direction: this.direction,
            moving: this.moving,
            service: this.service,
            elevatorID: this.elevatorID,
            numOfFloors: this.numOfFloors,
            numOfElevators: this.numOfElevators,
        };
    }

    public gotoFloor(floor: number | number[]): void {
        if (Array.isArray(floor)) {

            // unique id used to know which groups to group
            const uid = Math.random().toString(36).substr(2, 9);

            floor.forEach((val) => {
                this.elevatorQueue.push({ floor: val, uid });
            });
        } else {
            this.elevatorQueue.push({ floor });
        }

        // initialize our elevator
        this.moveElevator();
    }

    private resetElevator(): void {
        this.moving = false;
        this.direction = "idle";
        this.elevatorQueue.shift();

        // continue elevator queue
        if (this.elevatorQueue.length > 0) {
            if (this.elevatorQueue[0].uid) {
                console.log("\nDROP OFF COMPLETE, NEXT FLOOR (GROUP) BEING CALCULATED...");
            } else {
                console.log(`\nDROP OFF COMPLETE, NEXT FLOOR: ${this.elevatorQueue[0].floor}...`);
            }
            this.moveElevator();
        } else {
            console.log("\nDROP OFF COMPLETE, ELEVATOR IDLE!\n");
        }
    }

    private moveElevator(): void {

        // queue one request at a time
        if (!this.moving) {
            this.emitMoving();
            this.moving = true;
            const elevatorQueueGroup: IElevatorQueue[] = [];

            // determine if single or grouped request
            if (this.elevatorQueue[0].uid) {

                // lets group all grouped members by uid
                for (let i = 0; i < this.elevatorQueue.length; i++) {
                    const queueGroup = this.elevatorQueue[i];
                    if (queueGroup.uid === this.elevatorQueue[0].uid) {
                        elevatorQueueGroup.push(queueGroup);
                    }
                }
            }

            // elevator order priority algorithm
            if (elevatorQueueGroup.length > 0) {
                const upGroup: IElevatorQueue[] = [];
                const downGroup: IElevatorQueue[] = [];

                // first, we sort group numerically
                elevatorQueueGroup.sort((a, b) => a.floor - b.floor);

                // second, we delete the old queue order
                // and order them according to priority
                for (let i = 0; i < elevatorQueueGroup.length; i++) {
                    this.elevatorQueue.shift();
                    const queue = elevatorQueueGroup[i];

                    // avoid reprocessing group
                    delete queue.uid;

                    // we prioritize moving the elevator up
                    if (queue.floor > this.floor) {
                        upGroup.push(queue);
                    } else {
                        downGroup.push(queue);
                    }
                }

                // loop forwards and add them to the front in descending order
                for (let i = 0; i < downGroup.length; i++) {
                    this.elevatorQueue.unshift(downGroup[i]);
                }

                // loop backwards and add them to the front in ascending order
                for (let i = upGroup.length - 1; i >= 0; i--) {
                    this.elevatorQueue.unshift(upGroup[i]);
                }

                // free up some memory
                elevatorQueueGroup.splice(0);
            }

            // can't go above or below set number of floors
            if ((this.elevatorQueue[0].floor <= 0) || (this.elevatorQueue[0].floor > this.numOfFloors)) {
                console.log("\nElevator cannot access that floor!\n");
                this.resetElevator();
                return;
            }

            // check if elevator is on existing floor
            if (this.elevatorQueue[0].floor === this.floor) {
                console.log("\nElevator is on the same floor!\n");
                this.resetElevator();
                return;
            }

            // check if elevator requires service
            if (this.serviceCheck()) {
                console.log("\nElevator needs to be serviced!\n");
                return;
            }

            // determine direction and amount to move up or down
            const direction: string = this.elevatorQueue[0].floor > this.floor ? "up" : "down";
            const countUp: number = this.elevatorQueue[0].floor - this.floor;
            const countDown: number = this.floor - this.elevatorQueue[0].floor;
            const count: number = direction === "up" ? countUp : countDown;

            // helper function to check for last iterator
            const isLastFloor = (i: number): void => {
                this.emitFloor();

                if (i === count) {
                    console.log(`\nDROPPING OFF GUEST ON FLOOR ${this.elevatorQueue[0].floor} ...\n`);

                    setTimeout(() => {
                        this.trips++;
                        this.resetElevator();
                    }, this.config.elevatorDropoffSpeedMS);
                }
            };

            // move the elevator properly through the floors
            for (let i = 1; i < count + 1; i++) {
                const speed = i * this.config.elevatorTransitSpeedMS;
                this.direction = direction;

                if (direction === "up") {
                    setTimeout(() => {
                        this.floor++;
                        isLastFloor(i);
                    }, speed);
                } else {
                    setTimeout(() => {
                        this.floor--;
                        isLastFloor(i);
                    }, speed);
                }
            }
        }
    }

    private serviceCheck(): boolean {
        if (this.trips >= this.config.maxTrips) {
            this.service = true;
            this.emitService();
        }

        return this.service;
    }

    private emitFloor(): void {
        if (this.socket) {
            this.socket.emit("floor", this.getInfo());
        }
    }

    private emitMoving(): void {
        if (this.socket) {
            this.socket.emit("moving", this.getInfo());
        }
    }

    private emitService(): void {
        if (this.socket) {
            this.socket.emit("service", this.getInfo());
        }
    }
}
